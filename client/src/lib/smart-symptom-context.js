// Smart Symptom Context Detection with Contextual Emoji Hints

export class SmartSymptomDetector {
  constructor() {
    this.symptomCategories = {
      respiratory: {
        emoji: '🫁',
        keywords: ['cough', 'breathing', 'shortness of breath', 'chest tightness', 'wheezing', 'sputum', 'khansi', 'sans lene mein takleef', 'seene mein bharipan'],
        severity: {
          mild: ['occasional cough', 'light cough', 'halki khansi'],
          moderate: ['persistent cough', 'productive cough', 'lagatar khansi'],
          severe: ['blood in cough', 'severe breathing difficulty', 'khoon ke saath khansi']
        }
      },
      cardiovascular: {
        emoji: '❤️',
        keywords: ['chest pain', 'heart palpitations', 'irregular heartbeat', 'dizziness', 'seene mein dard', 'dil ki dharakne mein gadbadi'],
        severity: {
          mild: ['mild chest discomfort', 'halka seene mein dard'],
          moderate: ['chest tightness', 'palpitations', 'seene mein bharipan'],
          severe: ['severe chest pain', 'crushing pain', 'tez seene mein dard']
        }
      },
      gastrointestinal: {
        emoji: '🤢',
        keywords: ['nausea', 'vomiting', 'diarrhea', 'stomach pain', 'indigestion', 'ulti', 'pet mein dard', 'loose motion', 'acidity'],
        severity: {
          mild: ['mild nausea', 'halki ulti'],
          moderate: ['frequent vomiting', 'bar bar ulti'],
          severe: ['blood in vomit', 'severe dehydration', 'khoon ki ulti']
        }
      },
      neurological: {
        emoji: '🧠',
        keywords: ['headache', 'migraine', 'dizziness', 'confusion', 'sir dard', 'chakkar', 'bhram'],
        severity: {
          mild: ['mild headache', 'halka sir dard'],
          moderate: ['throbbing headache', 'tez sir dard'],
          severe: ['severe migraine', 'unbearable headache', 'asahaniya sir dard']
        }
      },
      musculoskeletal: {
        emoji: '🦴',
        keywords: ['joint pain', 'muscle pain', 'back pain', 'stiffness', 'jodon mein dard', 'muscles mein dard', 'kamar dard'],
        severity: {
          mild: ['mild joint stiffness', 'halka jodon ka dard'],
          moderate: ['joint swelling', 'jodon mein sujan'],
          severe: ['severe joint pain', 'inability to move', 'tez jodon ka dard']
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
        hindi: "मुझे आपके लक्षणों की पहचान करने में कुछ कठिनाई हो रही है। कृपया अधिक विस्तार से बताएं।",
        english: "I'm having some difficulty identifying your symptoms. Please provide more detailed information.",
        confidence: 0
      };
    }

    let hindiResponse = `**${patientDetails.name}** जी, मैंने आपके लक्षणों का विश्लेषण किया है:\n\n`;
    let englishResponse = `**${patientDetails.name}**, I've analyzed your symptoms:\n\n`;

    // Add detected symptoms with emoji hints
    detectedSymptoms.forEach((symptom, index) => {
      hindiResponse += `${symptom.emoji} **${symptom.category}**: ${symptom.description}\n`;
      englishResponse += `${symptom.emoji} **${symptom.category}**: ${symptom.description}\n`;
    });

    // Add contextual information
    if (contextualInfo.timeContext) {
      hindiResponse += `\n⏰ **समय संदर्भ**: ${contextualInfo.timeContext} के दौरान लक्षण\n`;
      englishResponse += `\n⏰ **Time Context**: Symptoms during ${contextualInfo.timeContext}\n`;
    }

    if (contextualInfo.duration) {
      hindiResponse += `📅 **अवधि**: ${contextualInfo.duration === 'acute' ? 'अचानक शुरू' : 'लंबे समय से'}\n`;
      englishResponse += `📅 **Duration**: ${contextualInfo.duration} onset\n`;
    }

    // Emergency flag
    if (contextualInfo.emergencyFlag) {
      hindiResponse += `\n🚨 **आपातकाल**: ये लक्षण गंभीर हैं! तुरंत अस्पताल जाएं या 108 कॉल करें।\n`;
      englishResponse += `\n🚨 **EMERGENCY**: These symptoms are serious! Seek immediate medical attention or call emergency services.\n`;
    }

    return {
      hindi: hindiResponse,
      english: englishResponse,
      confidence: analysis.analysisConfidence,
      severity: contextualInfo.severity,
      emergencyFlag: contextualInfo.emergencyFlag
    };
  }
}

// Export singleton instance
export const smartSymptomDetector = new SmartSymptomDetector();