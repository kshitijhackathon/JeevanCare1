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

export class LocalMultilingualEngine {
  
  // Language detection patterns
  private languagePatterns = {
    hindi: {
      keywords: ['दर्द', 'बुखार', 'सिरदर्द', 'पेट', 'गला', 'खांसी', 'मैं', 'मुझे', 'है', 'हो', 'रहा', 'में'],
      greeting: 'नमस्ते! मैं आपका AI डॉक्टर हूं। आपकी समस्या बताइए।',
      moreInfo: 'कृपया अपने लक्षणों के बारे में विस्तार से बताएं।'
    },
    english: {
      keywords: ['pain', 'fever', 'headache', 'stomach', 'throat', 'cough', 'i', 'me', 'my', 'have', 'feel'],
      greeting: 'Hello! I am your AI Doctor. Please tell me about your symptoms.',
      moreInfo: 'Please describe your symptoms in detail.'
    },
    bengali: {
      keywords: ['ব্যথা', 'জ্বর', 'মাথাব্যথা', 'পেট', 'গলা', 'কাশি', 'আমি', 'আমার'],
      greeting: 'নমস্কার! আমি আপনার AI ডাক্তার। আপনার সমস্যা বলুন।',
      moreInfo: 'দয়া করে আপনার লক্ষণগুলি বিস্তারিত বলুন।'
    },
    tamil: {
      keywords: ['வலி', 'காய்ச்சல்', 'தலைவலி', 'வயிறு', 'தொண்டை', 'இருமல்', 'நான்', 'எனக்கு'],
      greeting: 'வணக்கம்! நான் உங்கள் AI மருத்துவர். உங்கள் பிரச்சனையை சொல்லுங்கள்.',
      moreInfo: 'தயவுசெய்து உங்கள் அறிகுறிகளை விரிவாக சொல்லுங்கள்.'
    },
    telugu: {
      keywords: ['నొప్పి', 'జ్వరం', 'తలనొప్పి', 'కడుపు', 'గొంతు', 'దగ్గు', 'నేను', 'నాకు'],
      greeting: 'నమస్కారం! నేను మీ AI డాక్టర్. మీ సమస్య చెప్పండి.',
      moreInfo: 'దయచేసి మీ లక్షణాలను వివరంగా చెప్పండి.'
    }
  };

  // Medical knowledge base
  private medicalKnowledge = {
    'पेट दर्द': {
      hindi: {
        advice: 'पेट दर्द के लिए: खाली पेट न रहें, तेल-मसाले से बचें, पानी ज्यादा पियें।',
        medicines: [
          { name: 'ENO', dose: '1 sachet', freq: 'जरूरत के अनुसार', days: 2 },
          { name: 'Gelusil', dose: '2 tablets', freq: 'खाने के बाद', days: 3 }
        ],
        tests: ['Stool Test', 'Ultrasound (यदि दर्द जारी रहे)'],
        followUp: ['2-3 दिन में सुधार न हो तो डॉक्टर से मिलें', 'पानी ज्यादा पियें']
      }
    },
    'stomach pain': {
      english: {
        advice: 'For stomach pain: Avoid empty stomach, reduce oily food, drink more water.',
        medicines: [
          { name: 'ENO', dose: '1 sachet', freq: 'as needed', days: 2 },
          { name: 'Gelusil', dose: '2 tablets', freq: 'after meals', days: 3 }
        ],
        tests: ['Stool Test', 'Ultrasound (if pain persists)'],
        followUp: ['See doctor if no improvement in 2-3 days', 'Drink plenty of water']
      }
    },
    'बुखार': {
      hindi: {
        advice: 'बुखार के लिए: आराम करें, पानी ज्यादा पियें, हल्का भोजन लें।',
        medicines: [
          { name: 'Paracetamol', dose: '500mg', freq: 'दिन में 3 बार', days: 3 },
          { name: 'Crocin', dose: '1 tablet', freq: '6 घंटे में', days: 2 }
        ],
        tests: ['Blood Test', 'Malaria Test (यदि बुखार 3 दिन से ज्यादा)'],
        followUp: ['तापमान monitor करें', '102°F से ज्यादा हो तो तुरंत डॉक्टर के पास जाएं']
      }
    },
    'fever': {
      english: {
        advice: 'For fever: Take rest, drink plenty of water, eat light food.',
        medicines: [
          { name: 'Paracetamol', dose: '500mg', freq: '3 times daily', days: 3 },
          { name: 'Crocin', dose: '1 tablet', freq: 'every 6 hours', days: 2 }
        ],
        tests: ['Blood Test', 'Malaria Test (if fever persists over 3 days)'],
        followUp: ['Monitor temperature', 'See doctor immediately if fever goes above 102°F']
      }
    }
  };

  detectLanguage(text: string): string {
    const normalizedText = text.toLowerCase();
    let scores = { hindi: 0, english: 0, bengali: 0, tamil: 0, telugu: 0 };

    for (const [lang, config] of Object.entries(this.languagePatterns)) {
      for (const keyword of config.keywords) {
        if (normalizedText.includes(keyword.toLowerCase())) {
          scores[lang as keyof typeof scores]++;
        }
      }
    }

    const detectedLang = Object.keys(scores).reduce((a, b) => 
      scores[a as keyof typeof scores] > scores[b as keyof typeof scores] ? a : b
    );

    return detectedLang || 'english';
  }

  extractSymptoms(text: string, language: string): string[] {
    const symptoms = [];
    const normalizedText = text.toLowerCase();

    // Hindi symptoms
    if (language === 'hindi') {
      if (normalizedText.includes('पेट') && (normalizedText.includes('दर्द') || normalizedText.includes('दुख'))) {
        symptoms.push('पेट दर्द');
      }
      if (normalizedText.includes('बुखार') || normalizedText.includes('ज्वर')) {
        symptoms.push('बुखार');
      }
      if (normalizedText.includes('सिर') && normalizedText.includes('दर्द')) {
        symptoms.push('सिरदर्द');
      }
    }

    // English symptoms
    if (language === 'english') {
      if (normalizedText.includes('stomach') && normalizedText.includes('pain')) {
        symptoms.push('stomach pain');
      }
      if (normalizedText.includes('fever')) {
        symptoms.push('fever');
      }
      if (normalizedText.includes('headache') || (normalizedText.includes('head') && normalizedText.includes('pain'))) {
        symptoms.push('headache');
      }
    }

    return symptoms;
  }

  async generateMedicalAdvice(patientData: PatientData): Promise<MedicalResponse> {
    const { symptoms, lang } = patientData;
    const detectedLanguage = this.detectLanguage(symptoms);
    const extractedSymptoms = this.extractSymptoms(symptoms, detectedLanguage);

    // If no specific symptoms found, provide general guidance
    if (extractedSymptoms.length === 0) {
      const langConfig = this.languagePatterns[detectedLanguage as keyof typeof this.languagePatterns];
      return {
        responseText: langConfig.moreInfo,
        followUp: [
          detectedLanguage === 'hindi' ? 'अपने लक्षण विस्तार से बताएं' : 'Please describe your symptoms in detail',
          detectedLanguage === 'hindi' ? 'कब से परेशानी है?' : 'How long have you had these symptoms?'
        ],
        tests: [],
        medicines: [],
        severity: "low"
      };
    }

    // Get medical advice for detected symptoms
    const primarySymptom = extractedSymptoms[0];
    const medicalInfo = this.medicalKnowledge[primarySymptom as keyof typeof this.medicalKnowledge];

    if (medicalInfo) {
      const langSpecificInfo = medicalInfo[detectedLanguage as keyof typeof medicalInfo];
      if (langSpecificInfo) {
        return {
          responseText: langSpecificInfo.advice,
          followUp: langSpecificInfo.followUp,
          tests: langSpecificInfo.tests,
          medicines: langSpecificInfo.medicines,
          severity: this.assessSeverity(extractedSymptoms)
        };
      }
    }

    // Fallback response
    const fallbackResponses = {
      hindi: 'आपके लक्षणों के आधार पर, कृपया डॉक्टर से सलाह लें। पानी ज्यादा पियें और आराम करें।',
      english: 'Based on your symptoms, please consult a doctor. Drink plenty of water and take rest.',
      bengali: 'আপনার লক্ষণের ভিত্তিতে, দয়া করে ডাক্তারের পরামর্শ নিন।',
      tamil: 'உங்கள் அறிகுறிகளின் அடிப்படையில், மருத்துவரை அணுகுங்கள்।',
      telugu: 'మీ లక్షణాల ఆధారంగా, దయచేసి వైద్యుడిని సంప్రదించండి।'
    };

    return {
      responseText: fallbackResponses[detectedLanguage as keyof typeof fallbackResponses] || fallbackResponses.english,
      followUp: [
        detectedLanguage === 'hindi' ? 'यदि समस्या बनी रहे तो डॉक्टर से मिलें' : 'Consult doctor if problem persists'
      ],
      tests: [],
      medicines: [],
      severity: "moderate"
    };
  }

  private assessSeverity(symptoms: string[]): "low" | "moderate" | "high" {
    const highSeveritySymptoms = ['chest pain', 'difficulty breathing', 'severe headache'];
    const moderateSeveritySymptoms = ['fever', 'बुखार', 'persistent pain'];

    for (const symptom of symptoms) {
      if (highSeveritySymptoms.some(s => symptom.toLowerCase().includes(s))) {
        return "high";
      }
      if (moderateSeveritySymptoms.some(s => symptom.toLowerCase().includes(s))) {
        return "moderate";
      }
    }
    return "low";
  }
}

export const localMultilingualEngine = new LocalMultilingualEngine();