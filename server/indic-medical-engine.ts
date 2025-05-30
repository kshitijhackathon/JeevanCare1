import OpenAI from "openai";

interface PatientDetails {
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  language: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface MedicalResponse {
  greeting: string;
  diagnosis: string;
  medicines: Array<{
    name: string;
    composition: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    timing: string;
  }>;
  tests: Array<{
    name: string;
    type: string;
    urgency: string;
    instructions: string;
  }>;
  lifestyle: string[];
  precautions: string[];
  followUp: string;
  severity: 'mild' | 'moderate' | 'severe';
  emergencyContact: boolean;
}

export class IndicMedicalEngine {
  private openai: OpenAI;

  constructor() {
    // Using Mistral API for medical consultation
    this.openai = new OpenAI({
      baseURL: "https://api.mistral.ai/v1",
      apiKey: process.env.MISTRAL_API_KEY
    });
  }

  // Language detection and translation using IndicTrans-style approach
  detectLanguage(text: string): string {
    const patterns = {
      hindi: /[\u0900-\u097F]|दर्द|बुखार|खांसी|सिर|पेट|दवा|डॉक्टर/,
      english: /^[a-zA-Z\s.,!?]+$/,
      bengali: /[\u0980-\u09FF]|ব্যথা|জ্বর|কাশি|মাথা|পেট/,
      tamil: /[\u0B80-\u0BFF]|வலி|காய்ச்சல்|இருமல்|தலை|வயிறு/,
      telugu: /[\u0C00-\u0C7F]|నొప్పి|జ్వరం|దగ్గు|తల|కడుపు/,
      gujarati: /[\u0A80-\u0AFF]|દુખાવો|તાવ|ઉધરસ|માથું|પેટ/
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }
    return 'hindi'; // Default
  }

  // Enhanced medical consultation with human-like AI doctor
  async generateMedicalConsultation(symptoms: string, patientDetails: PatientDetails): Promise<MedicalResponse> {
    const detectedLang = this.detectLanguage(symptoms);
    
    // Create comprehensive medical prompt
    const prompt = this.buildMedicalPrompt(symptoms, patientDetails, detectedLang);

    try {
      const response = await this.openai.chat.completions.create({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(detectedLang)
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return this.formatMedicalResponse(result, detectedLang, patientDetails);

    } catch (error) {
      console.error('Medical consultation error:', error);
      return this.getFallbackResponse(symptoms, patientDetails, detectedLang);
    }
  }

  private getSystemPrompt(language: string): string {
    const prompts = {
      hindi: `आप एक अनुभवी भारतीय डॉक्टर हैं जो 15+ साल का अनुभव रखते हैं। आप मरीजों से बेहद सम्मानजनक और दयालु तरीके से बात करते हैं।

महत्वपूर्ण निर्देश:
- हमेशा भारतीय दवाओं और ब्रांड्स का सुझाव दें (जैसे Crocin, Combiflam, Cetrizine, Digene)
- खुराक हमेशा भारतीय मानकों के अनुसार दें
- मरीज़ को "आप" कहकर संबोधित करें
- सभी medical advice Hindi में दें
- JSON format में response दें

Response Structure:
{
  "greeting": "मरीज़ का नाम लेकर व्यक्तिगत अभिवादन",
  "diagnosis": "संभावित बीमारी का विस्तृत विश्लेषण",
  "medicines": [{"name": "दवा का नाम", "composition": "साल्ट", "dosage": "खुराक", "frequency": "दिन में कितनी बार", "duration": "कितने दिन", "instructions": "कैसे लें", "timing": "खाना खाने से पहले/बाद"}],
  "tests": [{"name": "जांच का नाम", "type": "blood/urine/x-ray", "urgency": "तुरंत/1-2 दिन में", "instructions": "विशेष निर्देश"}],
  "lifestyle": ["जीवनशैली सुझाव"],
  "precautions": ["सावधानियां"],
  "followUp": "कब वापस आना है",
  "severity": "mild/moderate/severe",
  "emergencyContact": true/false
}`,

      english: `You are an experienced Indian doctor with 15+ years of practice. You speak with patients in a respectful, caring manner using Indian English.

Important Guidelines:
- Always suggest Indian medicines and brands (Crocin, Combiflam, Cetrizine, Digene)
- Dosages should follow Indian medical standards
- Address patient respectfully
- Provide medical advice in English with Indian context
- Respond in JSON format

Response Structure:
{
  "greeting": "Personal greeting using patient's name",
  "diagnosis": "Detailed analysis of probable condition",
  "medicines": [{"name": "Medicine name", "composition": "Salt", "dosage": "Dose", "frequency": "How many times daily", "duration": "How many days", "instructions": "How to take", "timing": "Before/after meals"}],
  "tests": [{"name": "Test name", "type": "blood/urine/x-ray", "urgency": "immediate/1-2 days", "instructions": "Special instructions"}],
  "lifestyle": ["Lifestyle suggestions"],
  "precautions": ["Precautions"],
  "followUp": "When to return",
  "severity": "mild/moderate/severe",
  "emergencyContact": true/false
}`,

      bengali: `আপনি একজন অভিজ্ঞ ভারতীয় ডাক্তার যার ১৫+ বছরের অভিজ্ঞতা আছে। আপনি রোগীদের সাথে অত্যন্ত সম্মানজনক এবং যত্নশীল ভাবে কথা বলেন।

গুরুত্বপূর্ণ নির্দেশনা:
- সর্বদা ভারতীয় ওষুধ এবং ব্র্যান্ডের পরামর্শ দিন
- ভারতীয় মেডিকেল স্ট্যান্ডার্ড অনুযায়ী ডোজ দিন
- JSON ফরম্যাটে উত্তর দিন`,

      tamil: `நீங்கள் 15+ வருட அனுபவம் கொண்ட ஒரு அனுபவமிக்க இந்திய மருத்துவர். நோயாளிகளிடம் மிகவும் மரியாதையுடனும் அக்கறையுடனும் பேசுகிறீர்கள்।

முக்கியமான வழிகாட்டுதல்கள்:
- எப்போதும் இந்திய மருந்துகள் மற்றும் பிராண்டுகளை பரிந்துரைக்கவும்
- இந்திய மருத்துவ தரங்களின்படி மருந்தளவு கொடுக்கவும்
- JSON வடிவத்தில் பதில் தரவும்`,

      telugu: `మీరు 15+ సంవత్సరాల అనుభవం ఉన్న అనుభవజ్ఞులైన భారతీయ వైద్యుడు. రోగులతో అత్యంత గౌరవంగా మరియు శ్రద్ధగా మాట్లాడతారు।

ముఖ్యమైన మార్గదర్శకాలు:
- ఎల్లప్పుడూ భారతీయ మందులు మరియు బ్రాండ్లను సూచించండి
- భారతీయ వైద్య ప్రమాణాల ప్రకారం మోతాదులు ఇవ్వండి
- JSON ఫార్మాట్‌లో జవాబు ఇవ్వండి`
    };

    return prompts[language as keyof typeof prompts] || prompts.hindi;
  }

  private buildMedicalPrompt(symptoms: string, patient: PatientDetails, language: string): string {
    const templates = {
      hindi: `मरीज़ की जानकारी:
नाम: ${patient.name}
उम्र: ${patient.age} साल
लिंग: ${patient.gender}
रक्त समूह: ${patient.bloodGroup}

मरीज़ के लक्षण: ${symptoms}

कृपया एक विस्तृत medical consultation प्रदान करें जिसमें:
1. व्यक्तिगत अभिवादन
2. संभावित निदान
3. भारतीय दवाओं की सूची (ब्रांड नाम के साथ)
4. आवश्यक जांच
5. जीवनशैली सुझाव
6. सावधानियां
7. फॉलो-अप सलाह

JSON format में उत्तर दें।`,

      english: `Patient Information:
Name: ${patient.name}
Age: ${patient.age} years
Gender: ${patient.gender}
Blood Group: ${patient.bloodGroup}

Patient's Symptoms: ${symptoms}

Please provide a detailed medical consultation including:
1. Personal greeting
2. Probable diagnosis
3. Indian medicines list (with brand names)
4. Required tests
5. Lifestyle suggestions
6. Precautions
7. Follow-up advice

Respond in JSON format.`
    };

    return templates[language as keyof typeof templates] || templates.hindi;
  }

  private formatMedicalResponse(result: any, language: string, patient: PatientDetails): MedicalResponse {
    return {
      greeting: result.greeting || this.getDefaultGreeting(patient, language),
      diagnosis: result.diagnosis || "सामान्य जांच की आवश्यकता है",
      medicines: result.medicines || [],
      tests: result.tests || [],
      lifestyle: result.lifestyle || [],
      precautions: result.precautions || [],
      followUp: result.followUp || "2-3 दिन बाद मिलें यदि सुधार न हो",
      severity: result.severity || 'mild',
      emergencyContact: result.emergencyContact || false
    };
  }

  private getDefaultGreeting(patient: PatientDetails, language: string): string {
    const greetings = {
      hindi: `नमस्ते ${patient.name} जी, मैं डॉक्टर हूं। आपकी उम्र ${patient.age} साल है और आप ${patient.gender} हैं। आइए आपकी समस्या को समझते हैं।`,
      english: `Hello ${patient.name}, I'm your doctor. You are ${patient.age} years old. Let me understand your health concern.`,
      bengali: `নমস্কার ${patient.name}, আমি ডাক্তার। আপনার বয়স ${patient.age} বছর। আসুন আপনার সমস্যাটি বুঝি।`,
      tamil: `வணக்கம் ${patient.name}, நான் மருத்துவர். உங்கள் வயது ${patient.age}. உங்கள் பிரச்சினையை புரிந்து கொள்வோம்।`,
      telugu: `నమస్కారం ${patient.name}, నేను డాక్టర్. మీ వయస్సు ${patient.age} సంవత్సరాలు. మీ సమస్యను అర్థం చేసుకుందాం।`
    };

    return greetings[language as keyof typeof greetings] || greetings.hindi;
  }

  private getFallbackResponse(symptoms: string, patient: PatientDetails, language: string): MedicalResponse {
    return {
      greeting: this.getDefaultGreeting(patient, language),
      diagnosis: "आपके लक्षणों के आधार पर सामान्य जांच की सलाह दी जाती है",
      medicines: [
        {
          name: "Paracetamol (Crocin)",
          composition: "Paracetamol 500mg",
          dosage: "1 गोली",
          frequency: "दिन में 3 बार",
          duration: "3 दिन",
          instructions: "गर्म पानी के साथ लें",
          timing: "खाना खाने के बाद"
        }
      ],
      tests: [
        {
          name: "Complete Blood Count (CBC)",
          type: "blood",
          urgency: "2-3 दिन में",
          instructions: "खाली पेट जांच कराएं"
        }
      ],
      lifestyle: ["पर्याप्त आराम करें", "खूब पानी पिएं", "संतुलित आहार लें"],
      precautions: ["धूम्रपान न करें", "शराब से बचें", "तनाव कम करें"],
      followUp: "3 दिन बाद वापस मिलें यदि सुधार न हो",
      severity: 'mild',
      emergencyContact: false
    };
  }

  // Generate natural voice response text for TTS
  generateVoiceResponse(medicalResponse: MedicalResponse, language: string): string {
    const templates = {
      hindi: `${medicalResponse.greeting}

आपके लक्षणों के अनुसार, ${medicalResponse.diagnosis}

दवाइयां:
${medicalResponse.medicines.map((med, i) => 
  `${i + 1}. ${med.name} - ${med.dosage} ${med.frequency} ${med.duration} तक, ${med.timing}`
).join('\n')}

${medicalResponse.tests.length > 0 ? `जांच कराएं: ${medicalResponse.tests.map(test => test.name).join(', ')}` : ''}

सावधानियां: ${medicalResponse.precautions.join(', ')}

${medicalResponse.followUp}

धन्यवाद!`,

      english: `${medicalResponse.greeting}

Based on your symptoms, ${medicalResponse.diagnosis}

Medicines:
${medicalResponse.medicines.map((med, i) => 
  `${i + 1}. ${med.name} - ${med.dosage} ${med.frequency} for ${med.duration}, ${med.timing}`
).join('\n')}

${medicalResponse.tests.length > 0 ? `Tests required: ${medicalResponse.tests.map(test => test.name).join(', ')}` : ''}

Precautions: ${medicalResponse.precautions.join(', ')}

${medicalResponse.followUp}

Thank you!`
    };

    return templates[language as keyof typeof templates] || templates.hindi;
  }
}

export const indicMedicalEngine = new IndicMedicalEngine();