interface PatientData {
  name: string;
  age: number;
  gender: string;
  bloodGrp: string;
  symptoms: string;
  lang: string;
}

interface MedicalResponse {
  responseText: string;
  followUp: string[];
  tests: string[];
  medicines: Array<{
    name: string;
    dose: string;
    freq: string;
    days: number;
  }>;
  severity: "low" | "moderate" | "high";
}

export class MistralMedicalEngine {
  private apiKey: string;
  private baseUrl = 'https://api.mistral.ai/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('MISTRAL_API_KEY environment variable is required');
    }
  }

  detectLanguage(text: string): string {
    const hindiPattern = /[\u0900-\u097F]/;
    const bengaliPattern = /[\u0980-\u09FF]/;
    const tamilPattern = /[\u0B80-\u0BFF]/;
    const teluguPattern = /[\u0C00-\u0C7F]/;
    
    if (hindiPattern.test(text)) return "hindi";
    if (bengaliPattern.test(text)) return "bengali";
    if (tamilPattern.test(text)) return "tamil";
    if (teluguPattern.test(text)) return "telugu";
    return "english";
  }

  private buildMedicalPrompt(patientData: PatientData): string {
    const { name, age, gender, symptoms, lang } = patientData;
    
    const languageInstructions = {
      hindi: "कृपया हिंदी में जवाब दें।",
      english: "Please respond in English.",
      bengali: "দয়া করে বাংলায় উত্তর দিন।",
      tamil: "தயவுசெய்து தமிழில் பதிலளிக்கவும்।",
      telugu: "దయచేసి తెలుగులో సమాధానం ఇవ్వండి।"
    };

    return `You are Dr. AI, an expert multilingual virtual physician designed for primary care triage across India. You provide accurate medical guidance in multiple Indian languages.

Patient Information:
- Name: ${name}
- Age: ${age} years
- Gender: ${gender}
- Blood Group: ${patientData.bloodGrp}
- Symptoms: ${symptoms}
- Preferred Language: ${lang}

${languageInstructions[lang as keyof typeof languageInstructions] || languageInstructions.english}

Please provide a comprehensive medical assessment including:
1. Medical advice and explanation
2. Recommended medicines with Indian brand names, dosage, and frequency
3. Suggested medical tests if needed
4. Follow-up instructions
5. Severity assessment (low/moderate/high)

Format your response as a JSON object with these fields:
{
  "responseText": "Main medical advice in patient's language",
  "medicines": [
    {
      "name": "Medicine name (Indian brand)",
      "dose": "Dosage amount",
      "freq": "Frequency in patient's language",
      "days": number_of_days
    }
  ],
  "tests": ["List of recommended tests"],
  "followUp": ["Follow-up instructions in patient's language"],
  "severity": "low/moderate/high"
}

Important Guidelines:
- Use authentic Indian medicine brands (Cipla, Dr. Reddy's, Sun Pharma, etc.)
- Provide dosages appropriate for Indian patients
- Consider Indian dietary and lifestyle factors
- Include culturally appropriate advice
- Always recommend consulting a doctor for serious symptoms
- Use the patient's preferred language consistently`;
  }

  async generateMedicalAdvice(patientData: PatientData): Promise<MedicalResponse> {
    try {
      const prompt = this.buildMedicalPrompt(patientData);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        const medicalResponse = JSON.parse(content);
        
        // Validate and ensure proper structure
        return {
          responseText: medicalResponse.responseText || this.getFallbackResponse(patientData.lang),
          medicines: medicalResponse.medicines || [],
          tests: medicalResponse.tests || [],
          followUp: medicalResponse.followUp || [],
          severity: medicalResponse.severity || "moderate"
        };
      } catch (parseError) {
        console.error('Failed to parse Mistral response:', parseError);
        return this.getFallbackResponse(patientData.lang, content);
      }

    } catch (error) {
      console.error('Mistral AI medical consultation error:', error);
      return this.getFallbackResponse(patientData.lang);
    }
  }

  private getFallbackResponse(language: string, rawResponse?: string): MedicalResponse {
    const fallbackResponses = {
      hindi: {
        responseText: rawResponse || 'आपके लक्षणों के आधार पर, कृपया डॉक्टर से सलाह लें। पानी ज्यादा पियें और आराम करें।',
        followUp: ['यदि समस्या बनी रहे तो 2-3 दिन में डॉक्टर से मिलें', 'पानी ज्यादा पियें और आराम करें']
      },
      english: {
        responseText: rawResponse || 'Based on your symptoms, please consult a doctor. Drink plenty of water and take rest.',
        followUp: ['Consult doctor if symptoms persist for 2-3 days', 'Drink plenty of water and take rest']
      },
      bengali: {
        responseText: rawResponse || 'আপনার লক্ষণের ভিত্তিতে, দয়া করে ডাক্তারের পরামর্শ নিন।',
        followUp: ['লক্ষণ অব্যাহত থাকলে ডাক্তারের সাথে পরামর্শ করুন']
      },
      tamil: {
        responseText: rawResponse || 'உங்கள் அறிகுறிகளின் அடிப்படையில், மருத்துவரை அணுகுங்கள்।',
        followUp: ['அறிகுறிகள் தொடர்ந்தால் மருத்துவரை சந்திக்கவும்']
      },
      telugu: {
        responseText: rawResponse || 'మీ లక్షణాల ఆధారంగా, దయచేసి వైద్యుడిని సంప్రదించండి।',
        followUp: ['లక్షణాలు కొనసాగితే వైద్యుడిని సంప్రదించండి']
      }
    };

    const langResponse = fallbackResponses[language as keyof typeof fallbackResponses] || fallbackResponses.english;
    
    return {
      responseText: langResponse.responseText,
      followUp: langResponse.followUp,
      tests: [],
      medicines: [],
      severity: "moderate"
    };
  }

  extractSymptoms(text: string, language: string): string[] {
    const symptoms = [];
    const normalizedText = text.toLowerCase();

    // Common symptoms in different languages
    const symptomPatterns = {
      hindi: {
        'पेट दर्द': ['पेट', 'दर्द'],
        'बुखार': ['बुखार', 'ज्वर'],
        'सिरदर्द': ['सिर', 'दर्द'],
        'खांसी': ['खांसी', 'कफ'],
        'गला दर्द': ['गला', 'दर्द']
      },
      english: {
        'stomach pain': ['stomach', 'pain'],
        'fever': ['fever'],
        'headache': ['headache', 'head', 'pain'],
        'cough': ['cough'],
        'sore throat': ['throat', 'pain']
      }
    };

    const patterns = symptomPatterns[language as keyof typeof symptomPatterns] || symptomPatterns.english;
    
    for (const [symptom, keywords] of Object.entries(patterns)) {
      if (keywords.every(keyword => normalizedText.includes(keyword))) {
        symptoms.push(symptom);
      }
    }

    return symptoms;
  }
}

export const mistralMedicalEngine = new MistralMedicalEngine();