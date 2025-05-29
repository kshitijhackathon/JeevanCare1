// Smart Symptom Context Detection with Contextual Emoji Hints

export class SmartSymptomDetector {
  constructor() {
    this.symptomCategories = {
      respiratory: {
        emoji: '🫁',
        keywords: ['cough', 'coughing', 'breathing', 'shortness of breath', 'chest tightness', 'wheezing', 'sputum', 'phlegm', 'breathlessness', 
                  'khansi', 'khasi', 'sans lene mein takleef', 'seene mein bharipan', 'dam ghutna', 'saans ki kami', 'breathing problem',
                  'asthma', 'bronchitis', 'chest congestion', 'dry cough', 'wet cough', 'mucus', 'throat irritation'],
        severity: {
          mild: ['occasional cough', 'light cough', 'halki khansi', 'dry throat', 'slight breathlessness'],
          moderate: ['persistent cough', 'productive cough', 'lagatar khansi', 'regular breathing issues', 'chest discomfort'],
          severe: ['blood in cough', 'severe breathing difficulty', 'khoon ke saath khansi', 'can\'t breathe', 'gasping for air']
        }
      },
      cardiovascular: {
        emoji: '❤️',
        keywords: ['chest pain', 'heart palpitations', 'irregular heartbeat', 'dizziness', 'heart racing', 'heart attack', 'cardiac',
                  'seene mein dard', 'dil ki dharakne mein gadbadi', 'dil ki tez dharakan', 'chakkar aana', 'heart burn',
                  'angina', 'hypertension', 'blood pressure', 'bp high', 'bp low', 'heart disease', 'cardiac arrest'],
        severity: {
          mild: ['mild chest discomfort', 'halka seene mein dard', 'slight dizziness', 'minor palpitations'],
          moderate: ['chest tightness', 'palpitations', 'seene mein bharipan', 'moderate chest pain', 'heart racing'],
          severe: ['severe chest pain', 'crushing pain', 'tez seene mein dard', 'heart attack symptoms', 'cardiac emergency']
        }
      },
      gastrointestinal: {
        emoji: '🤢',
        keywords: ['nausea', 'vomiting', 'diarrhea', 'stomach pain', 'indigestion', 'constipation', 'bloating', 'gas',
                  'ulti', 'pet mein dard', 'loose motion', 'acidity', 'heartburn', 'stomach upset', 'food poisoning',
                  'abdominal pain', 'cramps', 'gastritis', 'ibs', 'stomach ache', 'pet ki gas', 'kabz', 'dast'],
        severity: {
          mild: ['mild nausea', 'halki ulti', 'slight stomach discomfort', 'minor indigestion'],
          moderate: ['frequent vomiting', 'bar bar ulti', 'persistent stomach pain', 'regular diarrhea'],
          severe: ['blood in vomit', 'severe dehydration', 'khoon ki ulti', 'severe abdominal pain', 'bloody stool']
        }
      },
      neurological: {
        emoji: '🧠',
        keywords: ['headache', 'migraine', 'dizziness', 'confusion', 'seizure', 'stroke', 'numbness', 'tingling',
                  'sir dard', 'chakkar', 'bhram', 'dimag ki kamzori', 'memory loss', 'forgetfulness',
                  'vertigo', 'fainting', 'unconscious', 'neurological', 'brain fog', 'concentration issues'],
        severity: {
          mild: ['mild headache', 'halka sir dard', 'slight dizziness', 'minor confusion'],
          moderate: ['throbbing headache', 'tez sir dard', 'persistent dizziness', 'memory issues'],
          severe: ['severe migraine', 'unbearable headache', 'asahaniya sir dard', 'seizure symptoms', 'stroke symptoms']
        }
      },
      musculoskeletal: {
        emoji: '🦴',
        keywords: ['joint pain', 'muscle pain', 'back pain', 'stiffness', 'arthritis', 'fracture', 'sprain', 'strain',
                  'jodon mein dard', 'muscles mein dard', 'kamar dard', 'neck pain', 'shoulder pain', 'knee pain',
                  'hip pain', 'ankle pain', 'wrist pain', 'muscle cramps', 'muscle spasm', 'bone pain'],
        severity: {
          mild: ['mild joint stiffness', 'halka jodon ka dard', 'minor muscle ache', 'slight stiffness'],
          moderate: ['joint swelling', 'jodon mein sujan', 'persistent pain', 'moderate stiffness'],
          severe: ['severe joint pain', 'inability to move', 'tez jodon ka dard', 'excruciating pain', 'complete immobility']
        }
      },
      dermatological: {
        emoji: '🟡',
        keywords: ['rash', 'itching', 'skin irritation', 'redness', 'khujli', 'skin par daag', 'lali'],
        severity: {
          mild: ['mild itching', 'halki khujli'],
          moderate: ['persistent rash', 'lagatar khujli'],
          severe: ['severe allergic reaction', 'tez allergy']
        }
      },
      infectious: {
        emoji: '🌡️',
        keywords: ['fever', 'chills', 'sweating', 'fatigue', 'bukhar', 'kmpkampi', 'pasina', 'kamzori'],
        severity: {
          mild: ['low grade fever', 'halka bukhar'],
          moderate: ['moderate fever', 'persistent fever', 'lagatar bukhar'],
          severe: ['high fever', 'tez bukhar', 'dangerous fever']
        }
      }
    };

    this.contextualHints = {
      time: {
        morning: ['morning sickness', 'early morning symptoms', 'subah ki takleef'],
        evening: ['evening fatigue', 'night symptoms', 'shaam ki kamzori'],
        night: ['night sweats', 'sleep disturbance', 'raat ko pasina']
      },
      duration: {
        acute: ['sudden onset', 'achanak shuru', 'immediate'],
        chronic: ['long term', 'lambe samay se', 'persistent', 'lagatar']
      },
      triggers: {
        food: ['after eating', 'khane ke baad', 'food related'],
        exercise: ['after physical activity', 'vyayam ke baad'],
        stress: ['during stress', 'tension mein', 'stress related']
      }
    };

    this.emergencyKeywords = [
      'severe', 'unbearable', 'crushing', 'sharp', 'sudden', 'emergency',
      'tez', 'asahaniya', 'achanak', 'bharipan', 'emergency'
    ];
  }

  detectSymptomContext(text) {
    const lowerText = text.toLowerCase();
    const detectedSymptoms = [];
    const contextualInfo = {
      categories: [],
      severity: 'mild',
      timeContext: null,
      duration: null,
      triggers: [],
      emergencyFlag: false
    };

    // Check for emergency keywords
    const hasEmergencyKeywords = this.emergencyKeywords.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
    if (hasEmergencyKeywords) {
      contextualInfo.emergencyFlag = true;
      contextualInfo.severity = 'severe';
    }

    // Detect symptom categories
    for (const [category, data] of Object.entries(this.symptomCategories)) {
      const foundKeywords = data.keywords.filter(keyword => 
        lowerText.includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length > 0) {
        // Determine severity for this category
        let categorySeverity = 'mild';
        for (const [severity, terms] of Object.entries(data.severity)) {
          if (terms.some(term => lowerText.includes(term.toLowerCase()))) {
            categorySeverity = severity;
            break;
          }
        }

        detectedSymptoms.push({
          category,
          emoji: data.emoji,
          keywords: foundKeywords,
          severity: categorySeverity,
          description: this.getSymptomDescription(category, categorySeverity)
        });

        contextualInfo.categories.push(category);
        
        // Update overall severity
        if (categorySeverity === 'severe' || contextualInfo.severity !== 'severe') {
          contextualInfo.severity = categorySeverity;
        }
      }
    }

    // Detect time context
    for (const [timeType, keywords] of Object.entries(this.contextualHints.time)) {
      if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
        contextualInfo.timeContext = timeType;
        break;
      }
    }

    // Detect duration context
    for (const [durationType, keywords] of Object.entries(this.contextualHints.duration)) {
      if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
        contextualInfo.duration = durationType;
        break;
      }
    }

    // Detect triggers
    for (const [triggerType, keywords] of Object.entries(this.contextualHints.triggers)) {
      if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
        contextualInfo.triggers.push(triggerType);
      }
    }

    return {
      detectedSymptoms,
      contextualInfo,
      originalText: text,
      analysisConfidence: this.calculateConfidence(detectedSymptoms, contextualInfo)
    };
  }

  getSymptomDescription(category, severity) {
    const descriptions = {
      respiratory: {
        mild: 'Mild respiratory discomfort - monitor symptoms',
        moderate: 'Moderate breathing issues - consider medical consultation', 
        severe: 'Severe respiratory distress - seek immediate medical attention'
      },
      cardiovascular: {
        mild: 'Minor heart-related symptoms - lifestyle monitoring recommended',
        moderate: 'Notable cardiovascular symptoms - medical evaluation advised',
        severe: 'Critical heart symptoms - emergency medical care required'
      },
      gastrointestinal: {
        mild: 'Minor digestive issues - dietary adjustments may help',
        moderate: 'Persistent digestive problems - medical review suggested',
        severe: 'Severe gastrointestinal distress - urgent medical care needed'
      },
      neurological: {
        mild: 'Mild neurological symptoms - rest and observation',
        moderate: 'Concerning neurological signs - medical consultation recommended',
        severe: 'Serious neurological symptoms - immediate medical attention required'
      },
      musculoskeletal: {
        mild: 'Minor muscle/joint discomfort - rest and gentle movement',
        moderate: 'Persistent musculoskeletal pain - consider physiotherapy',
        severe: 'Severe musculoskeletal injury - medical examination needed'
      },
      dermatological: {
        mild: 'Minor skin irritation - topical care recommended',
        moderate: 'Persistent skin condition - dermatological consultation advised',
        severe: 'Severe skin reaction - immediate medical attention required'
      },
      infectious: {
        mild: 'Mild infection signs - rest and hydration',
        moderate: 'Developing infection - medical monitoring recommended',
        severe: 'Severe infection symptoms - urgent medical treatment needed'
      }
    };

    return descriptions[category]?.[severity] || 'Symptom detected - medical consultation recommended';
  }

  calculateConfidence(symptoms, context) {
    let confidence = 0;
    
    // Base confidence from symptom detection
    confidence += symptoms.length * 20;
    
    // Bonus for context information
    if (context.timeContext) confidence += 10;
    if (context.duration) confidence += 10;
    if (context.triggers.length > 0) confidence += 10;
    
    // Cap at 100%
    return Math.min(confidence, 100);
  }

  generateContextualResponse(analysis, patientDetails) {
    const { detectedSymptoms, contextualInfo } = analysis;
    
    if (detectedSymptoms.length === 0) {
      return {
        hindi: `प्रिय ${patientDetails.name} जी, मैं आपकी मदद करना चाहती हूं। कृपया अपने लक्षणों के बारे में थोड़ा और विस्तार से बताएं ताकि मैं आपको बेहतर सलाह दे सकूं। 💕`,
        english: `Dear ${patientDetails.name}, I'm here to help you feel better. Please tell me a bit more about your symptoms so I can provide you with the best care possible. 💕`,
        confidence: 0
      };
    }

    let hindiResponse = `प्रिय ${patientDetails.name} जी, आपने बहुत अच्छे से अपनी समस्या बताई है। मैंने आपके लक्षणों का सावधानीपूर्वक विश्लेषण किया है:\n\n`;
    let englishResponse = `Dear ${patientDetails.name}, thank you for sharing your concerns with me. I've carefully analyzed your symptoms and I'm here to help you feel better:\n\n`;

    // Add detected symptoms with emoji hints and caring tone
    detectedSymptoms.forEach((symptom, index) => {
      const sweetDescription = this.getSweetSymptomDescription(symptom.category, symptom.severity, patientDetails.language);
      hindiResponse += `${symptom.emoji} **${this.getCategoryNameHindi(symptom.category)}**: ${sweetDescription.hindi}\n`;
      englishResponse += `${symptom.emoji} **${this.getCategoryNameEnglish(symptom.category)}**: ${sweetDescription.english}\n`;
    });

    // Add contextual information with care
    if (contextualInfo.timeContext) {
      hindiResponse += `\n⏰ मैंने देखा है कि आपको ${contextualInfo.timeContext} के समय परेशानी होती है। यह जानकारी इलाज में बहुत मददगार है।\n`;
      englishResponse += `\n⏰ I notice your symptoms occur during ${contextualInfo.timeContext}. This information helps me provide better care for you.\n`;
    }

    if (contextualInfo.duration) {
      const durationText = contextualInfo.duration === 'acute' ? 
        { hindi: 'अचानक शुरू हुई', english: 'started suddenly' } :
        { hindi: 'कुछ समय से चल रही', english: 'been ongoing' };
      hindiResponse += `📅 आपकी समस्या ${durationText.hindi} है, जिससे मुझे सही इलाज की दिशा मिल गई है।\n`;
      englishResponse += `📅 Your symptoms have ${durationText.english}, which helps me understand how to best help you.\n`;
    }

    // Sweet encouragement based on severity
    if (contextualInfo.severity === 'mild') {
      hindiResponse += `\n💚 खुशी की बात यह है कि आपकी समस्या हल्की है। सही देखभाल के साथ आप जल्दी ठीक हो जाएंगे।\n`;
      englishResponse += `\n💚 The good news is that your symptoms are mild. With proper care, you'll feel much better soon.\n`;
    } else if (contextualInfo.severity === 'moderate') {
      hindiResponse += `\n💛 चिंता न करें, आपकी समस्या का इलाज संभव है। मैं आपको ऐसी दवाएं सुझाऊंगी जो आपको आराम दिलाएंगी।\n`;
      englishResponse += `\n💛 Please don't worry - your condition is treatable. I'll recommend medications that will help you feel comfortable and heal properly.\n`;
    }

    // Emergency flag with care
    if (contextualInfo.emergencyFlag) {
      hindiResponse += `\n🚨 प्रिय ${patientDetails.name} जी, आपकी सुरक्षा मेरी प्राथमिकता है। कृपया तुरंत नजदीकी अस्पताल जाएं या 108 पर कॉल करें। आप बिल्कुल ठीक हो जाएंगे! 💕\n`;
      englishResponse += `\n🚨 Dear ${patientDetails.name}, your safety is my top priority. Please go to the nearest hospital immediately or call emergency services. You're going to be okay! 💕\n`;
    } else {
      hindiResponse += `\n✨ आप बहुत जल्दी बेहतर महसूस करेंगे। मैं आपके साथ हूं! 🌟`;
      englishResponse += `\n✨ You're going to feel so much better very soon. I'm here to support you! 🌟`;
    }

    return {
      hindi: hindiResponse,
      english: englishResponse,
      confidence: analysis.analysisConfidence,
      severity: contextualInfo.severity,
      emergencyFlag: contextualInfo.emergencyFlag
    };
  }

  getCategoryNameHindi(category) {
    const names = {
      respiratory: 'सांस संबंधी',
      cardiovascular: 'हृदय संबंधी', 
      gastrointestinal: 'पेट संबंधी',
      neurological: 'न्यूरोलॉजिकल',
      musculoskeletal: 'हड्डी-मांसपेशी',
      dermatological: 'त्वचा संबंधी',
      infectious: 'संक्रमण संबंधी'
    };
    return names[category] || category;
  }

  getCategoryNameEnglish(category) {
    const names = {
      respiratory: 'Respiratory Care',
      cardiovascular: 'Heart Health', 
      gastrointestinal: 'Digestive Wellness',
      neurological: 'Neurological Health',
      musculoskeletal: 'Bone & Muscle Care',
      dermatological: 'Skin Health',
      infectious: 'Infection Management'
    };
    return names[category] || category;
  }

  getSweetSymptomDescription(category, severity, language) {
    const descriptions = {
      respiratory: {
        mild: {
          hindi: 'आपकी सांस की हल्की परेशानी ठीक हो जाएगी। थोड़ा आराम और सही दवा से आप बेहतर महसूस करेंगे। 💚',
          english: 'Your breathing discomfort is mild and will improve with proper rest and care. You\'ll feel much better soon! 💚'
        },
        moderate: {
          hindi: 'आपकी सांस की समस्या का इलाज है। मैं आपको कुछ दवाएं दूंगी जो आराम दिलाएंगी। 💛',
          english: 'Your breathing concerns are manageable. I\'ll recommend treatments that will help you breathe easier and feel more comfortable. 💛'
        },
        severe: {
          hindi: 'आपकी सांस की गंभीर समस्या के लिए तुरंत चिकित्सा सहायता लें। आप ठीक हो जाएंगे! ❤️',
          english: 'Your breathing symptoms need immediate medical attention. Please get help right away - you\'re going to be okay! ❤️'
        }
      },
      cardiovascular: {
        mild: {
          hindi: 'आपके दिल की हल्की परेशानी चिंता की बात नहीं। आराम और सही देखभाल से ठीक हो जाएगी। 💚',
          english: 'Your heart symptoms are mild and nothing to worry about. With proper care and rest, you\'ll feel much better! 💚'
        },
        moderate: {
          hindi: 'आपके दिल की समस्या का सही इलाज है। मैं आपको वह दवाएं दूंगी जो आराम दिलाएंगी। 💛',
          english: 'Your heart condition is very treatable. I\'ll prescribe medications that will help you feel comfortable and strong again. 💛'
        },
        severe: {
          hindi: 'आपके दिल की सुरक्षा के लिए तुरंत अस्पताल जाना जरूरी है। आप बहुत जल्दी ठीक हो जाएंगे! ❤️',
          english: 'For your heart\'s safety, please get immediate medical care. You\'re going to recover beautifully! ❤️'
        }
      }
      // Add more categories as needed
    };
    
    return descriptions[category]?.[severity] || {
      hindi: 'आपकी समस्या का इलाज संभव है। सही देखभाल से आप जल्दी ठीक हो जाएंगे! 💕',
      english: 'Your condition is treatable. With proper care, you\'ll feel wonderful again very soon! 💕'
    };
  }
}

// Export singleton instance
export const smartSymptomDetector = new SmartSymptomDetector();