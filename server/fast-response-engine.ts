interface FastResponse {
  text: string;
  confidence: number;
  followUpQuestion?: string;
  urgency: 'low' | 'medium' | 'high';
  category: string;
}

interface SymptomPattern {
  keywords: string[];
  responses: { [lang: string]: string };
  followUps: { [lang: string]: string };
  urgency: 'low' | 'medium' | 'high';
  category: string;
}

export class FastResponseEngine {
  private symptomPatterns: SymptomPattern[] = [
    // Fever patterns
    {
      keywords: ['fever', 'bukhar', 'बुखार', 'तेज़ बुखार', 'high temperature', 'गर्मी'],
      responses: {
        'hin_Deva': 'मैं समझ गया आपको बुखार है। कितने दिन से बुखार है?',
        'eng_Latn': 'I understand you have fever. How many days have you had fever?'
      },
      followUps: {
        'hin_Deva': 'क्या साथ में सिरदर्द या गले में खराश भी है?',
        'eng_Latn': 'Do you also have headache or sore throat?'
      },
      urgency: 'medium',
      category: 'fever'
    },
    
    // Headache patterns
    {
      keywords: ['headache', 'सिरदर्द', 'sir dard', 'sar dard', 'head pain', 'दर्द'],
      responses: {
        'hin_Deva': 'सिरदर्द की समस्या है। कितना तेज़ दर्द है 1 से 10 के बीच?',
        'eng_Latn': 'You have headache. How severe is the pain on scale 1 to 10?'
      },
      followUps: {
        'hin_Deva': 'क्या चक्कर भी आ रहे हैं या उल्टी का मन है?',
        'eng_Latn': 'Are you feeling dizzy or nauseous?'
      },
      urgency: 'medium',
      category: 'headache'
    },

    // Stomach pain patterns
    {
      keywords: ['stomach pain', 'pet dard', 'पेट दर्द', 'pet mein dard', 'belly pain', 'गैस'],
      responses: {
        'hin_Deva': 'पेट दर्द हो रहा है। दर्द कहाँ पर ज्यादा है - ऊपर या नीचे?',
        'eng_Latn': 'You have stomach pain. Where is the pain more - upper or lower abdomen?'
      },
      followUps: {
        'hin_Deva': 'क्या दस्त या कब्ज़ की समस्या भी है?',
        'eng_Latn': 'Do you have diarrhea or constipation?'
      },
      urgency: 'medium',
      category: 'stomach'
    },

    // Vomiting patterns
    {
      keywords: ['vomiting', 'उल्टी', 'ulti', 'vomit', 'throwing up', 'जी मचलाना'],
      responses: {
        'hin_Deva': 'उल्टी हो रही है। कितनी बार उल्टी हुई है आज?',
        'eng_Latn': 'You are vomiting. How many times have you vomited today?'
      },
      followUps: {
        'hin_Deva': 'क्या पानी पीने से भी उल्टी होती है?',
        'eng_Latn': 'Do you vomit even after drinking water?'
      },
      urgency: 'high',
      category: 'vomiting'
    },

    // Cold and cough patterns
    {
      keywords: ['cold', 'cough', 'सर्दी', 'खांसी', 'जुकाम', 'khansi', 'sardi', 'runny nose'],
      responses: {
        'hin_Deva': 'सर्दी-खांसी है। कब से शुरू हुआ है?',
        'eng_Latn': 'You have cold and cough. When did it start?'
      },
      followUps: {
        'hin_Deva': 'क्या बलगम आता है या सूखी खांसी है?',
        'eng_Latn': 'Is there phlegm or is it dry cough?'
      },
      urgency: 'low',
      category: 'cold'
    },

    // Skin infection patterns
    {
      keywords: ['skin', 'rash', 'खुजली', 'itching', 'skin infection', 'दाने', 'allergy'],
      responses: {
        'hin_Deva': 'त्वचा की समस्या है। कहाँ पर खुजली या दाने हैं?',
        'eng_Latn': 'You have skin problem. Where is the itching or rash?'
      },
      followUps: {
        'hin_Deva': 'क्या पहले भी ऐसी एलर्जी हुई है?',
        'eng_Latn': 'Have you had such allergy before?'
      },
      urgency: 'low',
      category: 'skin'
    }
  ];

  // Auto detect language from text
  detectLanguage(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Hindi/Hinglish detection
    if (/[\u0900-\u097F]/.test(text) || 
        /\b(hai|ho|ka|ki|ke|mein|aur|kya|kaise|kahan|bukhar|dard|pet|sir)\b/.test(lowerText)) {
      return 'hin_Deva';
    }
    
    return 'eng_Latn'; // Default to English
  }

  // Generate fast response based on symptoms
  async generateFastResponse(userText: string): Promise<FastResponse> {
    const detectedLang = this.detectLanguage(userText);
    const lowerText = userText.toLowerCase();

    // Find best matching pattern
    let bestMatch: SymptomPattern | null = null;
    let maxScore = 0;

    for (const pattern of this.symptomPatterns) {
      let score = 0;
      for (const keyword of pattern.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          score++;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = pattern;
      }
    }

    if (bestMatch && maxScore > 0) {
      const response = bestMatch.responses[detectedLang] || bestMatch.responses['eng_Latn'];
      const followUp = bestMatch.followUps[detectedLang] || bestMatch.followUps['eng_Latn'];
      
      return {
        text: response,
        confidence: Math.min(0.9, maxScore * 0.3),
        followUpQuestion: followUp,
        urgency: bestMatch.urgency,
        category: bestMatch.category
      };
    }

    // Generic response for unknown symptoms
    const genericResponses = {
      'hin_Deva': 'मैं आपकी बात समझ गया। कृपया अपने लक्षणों के बारे में और बताएं।',
      'eng_Latn': 'I understand. Please tell me more about your symptoms.'
    };

    return {
      text: genericResponses[detectedLang] || genericResponses['eng_Latn'],
      confidence: 0.7,
      followUpQuestion: detectedLang === 'hin_Deva' ? 
        'आपको कोई और परेशानी भी है?' : 
        'Do you have any other problems?',
      urgency: 'low',
      category: 'general'
    };
  }

  // Generate instant acknowledgment (within 500ms)
  getInstantAck(detectedLang: string): string {
    const acks = {
      'hin_Deva': 'हाँ, मैं समझ गया...',
      'eng_Latn': 'Yes, I understand...'
    };
    return acks[detectedLang] || acks['eng_Latn'];
  }

  // Get urgency-based response time
  getResponseTime(urgency: 'low' | 'medium' | 'high'): number {
    switch (urgency) {
      case 'high': return 500; // 0.5 seconds
      case 'medium': return 1000; // 1 second  
      case 'low': return 1500; // 1.5 seconds
      default: return 1000;
    }
  }
}

export const fastResponseEngine = new FastResponseEngine();