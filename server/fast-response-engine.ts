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

  // Generate fast response using Groq API
  async generateFastResponse(userText: string): Promise<FastResponse> {
    const detectedLang = this.detectLanguage(userText);
    
    try {
      // Use Groq API for intelligent medical responses
      const groqResponse = await this.callGroqAPI(userText, detectedLang);
      
      if (groqResponse) {
        // Determine urgency and category from user text
        const urgency = this.determineUrgency(userText);
        const category = this.determineCategory(userText);
        
        return {
          text: groqResponse.response,
          confidence: 0.95,
          followUpQuestion: groqResponse.followUp,
          urgency,
          category
        };
      }
    } catch (error) {
      console.error('Groq API failed, using pattern matching:', error);
    }

    // Fallback to pattern matching if Groq fails
    return this.generatePatternBasedResponse(userText, detectedLang);
  }

  // Call Groq API for medical responses
  private async callGroqAPI(userText: string, language: string): Promise<{response: string, followUp: string} | null> {
    try {
      if (!process.env.GROQ_API_KEY) {
        console.log('GROQ_API_KEY not found, using fallback responses');
        return null;
      }

      const languageInstruction = language === 'hin_Deva' ? 
        'Respond only in Hindi (Devanagari script)' : 'Respond only in English';

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are Dr. AI, a medical assistant. ${languageInstruction}. Give brief medical advice in 30-40 words. Always ask ONE follow-up question. If patient says bye/goodbye/dhanyawad/thank you, respond with goodbye message. Be professional and caring.`
            },
            {
              role: 'user',
              content: userText
            }
          ],
          temperature: 0.2,
          max_tokens: 100,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Groq API error: ${response.status} - ${errorText}`);
        return null;
      }

      const data = await response.json();
      const fullResponse = data.choices[0]?.message?.content;
      
      if (!fullResponse) {
        return null;
      }

      // Check if it's a goodbye/conclusion
      const isGoodbye = /bye|goodbye|धन्यवाद|thanks|समाप्त|खत्म|बंद/i.test(userText);
      
      if (isGoodbye) {
        const goodbyeMsg = language === 'hin_Deva' ? 
          'धन्यवाद! स्वस्थ रहें। यदि कोई और समस्या हो तो डॉक्टर से मिलें।' :
          'Thank you! Stay healthy. Please consult a doctor if you have any concerns.';
        
        return {
          response: goodbyeMsg,
          followUp: ''
        };
      }

      // Split response and follow-up
      const sentences = fullResponse.split(/[।?!.]/);
      const mainResponse = sentences[0] + (sentences.length > 1 ? '।' : '');
      const followUp = sentences.slice(1).join('').trim() || 
        (language === 'hin_Deva' ? 'कब से यह समस्या है?' : 'How long have you had this?');

      return {
        response: mainResponse.trim(),
        followUp: followUp.trim()
      };

    } catch (error) {
      console.error('Groq API call failed:', error);
      return null;
    }
  }

  // Pattern-based fallback response
  private generatePatternBasedResponse(userText: string, detectedLang: string): FastResponse {
    const lowerText = userText.toLowerCase();

    // Check for goodbye/completion signals
    const isGoodbye = /^(bye|goodbye|धन्यवाद|thanks|thank you|समाप्त|खत्म|बंद|ठीक है|thik hai|ok|fine|enough|bas|बस)$/i.test(userText.trim());
    
    if (isGoodbye) {
      const goodbyeResponses = {
        'hin_Deva': 'धन्यवाद! स्वस्थ रहें। यदि कोई और समस्या हो तो डॉक्टर से मिलें।',
        'eng_Latn': 'Thank you! Stay healthy. Please consult a doctor if you have any concerns.'
      };
      
      return {
        text: goodbyeResponses[detectedLang] || goodbyeResponses['eng_Latn'],
        confidence: 0.95,
        followUpQuestion: '',
        urgency: 'low',
        category: 'goodbye'
      };
    }

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
      const responses = bestMatch.responses as any;
      const followUps = bestMatch.followUps as any;
      
      const response = responses[detectedLang] || responses['eng_Latn'];
      const followUp = followUps[detectedLang] || followUps['eng_Latn'];
      
      return {
        text: response,
        confidence: Math.min(0.9, maxScore * 0.3),
        followUpQuestion: followUp,
        urgency: bestMatch.urgency,
        category: bestMatch.category
      };
    }

    // Enhanced generic responses with continuity
    const continuationResponses = {
      'hin_Deva': 'मैं समझ गया। कृपया अधिक विस्तार से बताएं - यह कब से शुरू हुआ है?',
      'eng_Latn': 'I understand. Please tell me more details - when did this start?'
    };

    return {
      text: continuationResponses[detectedLang] || continuationResponses['eng_Latn'],
      confidence: 0.8,
      followUpQuestion: detectedLang === 'hin_Deva' ? 
        'कितना तेज़ दर्द/परेशानी है?' : 
        'How severe is the pain/discomfort?',
      urgency: 'medium',
      category: 'general'
    };
  }

  // Determine urgency from text
  private determineUrgency(text: string): 'low' | 'medium' | 'high' {
    const urgentKeywords = ['severe', 'emergency', 'bleeding', 'chest pain', 'तेज़ दर्द', 'खून', 'सांस'];
    const mediumKeywords = ['pain', 'fever', 'headache', 'दर्द', 'बुखार', 'सिरदर्द'];
    
    const lowerText = text.toLowerCase();
    
    if (urgentKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      return 'high';
    }
    if (mediumKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      return 'medium';
    }
    return 'low';
  }

  // Determine category from text
  private determineCategory(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (/fever|bukhar|बुखार/.test(lowerText)) return 'fever';
    if (/headache|सिरदर्द|sir/.test(lowerText)) return 'headache';
    if (/stomach|pet|पेट/.test(lowerText)) return 'stomach';
    if (/vomit|उल्टी|ulti/.test(lowerText)) return 'vomiting';
    if (/cold|cough|सर्दी|खांसी/.test(lowerText)) return 'cold';
    if (/skin|rash|खुजली/.test(lowerText)) return 'skin';
    
    return 'general';
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