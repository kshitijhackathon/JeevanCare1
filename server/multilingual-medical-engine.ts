import OpenAI from "openai";

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

export class MultilingualMedicalEngine {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }

  detectLanguage(text: string): string {
    // Simple language detection based on script/common words
    const hindiPattern = /[\u0900-\u097F]/;
    const bengaliPattern = /[\u0980-\u09FF]/;
    const tamilPattern = /[\u0B80-\u0BFF]/;
    const teluguPattern = /[\u0C00-\u0C7F]/;
    const marathiPattern = /[\u0900-\u097F]/; // Similar to Hindi
    
    if (hindiPattern.test(text)) return "hi";
    if (bengaliPattern.test(text)) return "bn";
    if (tamilPattern.test(text)) return "ta";
    if (teluguPattern.test(text)) return "te";
    if (marathiPattern.test(text)) return "mr";
    
    // English fallback
    return "en";
  }

  async translateToEnglish(text: string, sourceLang: string): Promise<string> {
    // For MVP, use OpenAI for translation
    // In production, integrate with IndicTrans or Bhashini
    if (sourceLang === "en") return text;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Translate the following medical symptoms from ${sourceLang} to clear, medical English. Preserve all medical details and symptom descriptions accurately.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.2
      });

      return response.choices[0].message.content || text;
    } catch (error) {
      console.error("Translation failed:", error);
      return text; // Fallback to original
    }
  }

  async generateMedicalAdvice(patientData: PatientData): Promise<MedicalResponse> {
    const systemPrompt = `You are "Dr AI," a multilingual virtual physician designed for primary-care triage across India.

OPERATING RULES:
1. Listen First - Read the entire patient JSON before responding
2. Ask Clarifying Questions - If critical details are missing, ask 1-2 follow-ups in simple terms
3. Language Flow - All outgoing text in responseText must be in the patient's language (${patientData.lang})
4. Clinical Assessment - Begin with greeting using patient's name, offer concise explanation
5. Personalized Recommendations - List tests, medicines with dose/frequency/duration
6. Red-Flag Safety - If emergency symptoms detected, set severity="high" and recommend immediate care
7. Voice Optimization - Keep sentences to 15 words or fewer for clear speech
8. Strict JSON Output - Return exactly one JSON object

Return JSON in this exact format:
{
  "responseText": "<doctor-style advice in patient's language>",
  "followUp": ["<question1>", "<question2>"],
  "tests": ["<Test A>", "<Test B>"],
  "medicines": [
    {"name":"<GenericName>","dose":"<e.g. 500 mg>","freq":"<e.g. BID>","days":<n>}
  ],
  "severity": "low" | "moderate" | "high"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(patientData) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 800
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Validate response structure
      return {
        responseText: result.responseText || "I need more information to help you properly.",
        followUp: result.followUp || [],
        tests: result.tests || [],
        medicines: result.medicines || [],
        severity: result.severity || "low"
      };

    } catch (error) {
      console.error("Medical advice generation failed:", error);
      
      // Safe fallback response
      return {
        responseText: patientData.lang === "hi" 
          ? "मुझे आपकी मदद करने के लिए अधिक जानकारी चाहिए। कृपया अपने लक्षणों के बारे में विस्तार से बताएं।"
          : "I need more information to help you. Please describe your symptoms in detail.",
        followUp: [],
        tests: [],
        medicines: [],
        severity: "low"
      };
    }
  }

  async textToSpeech(text: string, lang: string): Promise<Buffer | null> {
    // For MVP, we'll handle TTS on frontend
    // In production, integrate with gTTS, Coqui TTS, or Silero
    return null;
  }

  // Extract symptoms for local processing
  extractSymptoms(text: string): string[] {
    const symptoms: string[] = [];
    const commonSymptoms = [
      'fever', 'बुखार', 'pain', 'दर्द', 'headache', 'सिरदर्द',
      'cough', 'खांसी', 'cold', 'सर्दी', 'vomiting', 'उल्टी',
      'nausea', 'मतली', 'diarrhea', 'दस्त', 'weakness', 'कमजोरी',
      'tired', 'थकान', 'breathing', 'सांस', 'chest', 'छाती'
    ];

    commonSymptoms.forEach(symptom => {
      if (text.toLowerCase().includes(symptom.toLowerCase())) {
        symptoms.push(symptom);
      }
    });

    return symptoms;
  }
}

export const multilingualMedicalEngine = new MultilingualMedicalEngine();