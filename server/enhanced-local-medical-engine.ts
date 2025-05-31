// Enhanced Local Medical Engine for Disease Detection and Treatment
interface MedicalCondition {
  name: string;
  symptoms: string[];
  severity: 'mild' | 'moderate' | 'severe';
  commonCauses: string[];
  riskFactors: string[];
  treatments: string[];
  medications: string[];
  doList: string[];
  dontList: string[];
  followUp: string[];
  diet: string[];
}

// Comprehensive medical conditions database
const MEDICAL_CONDITIONS: Record<string, MedicalCondition> = {
  'Common Cold': {
    name: 'Common Cold',
    symptoms: ['runny_nose', 'sneezing', 'sore_throat', 'cough', 'mild_fever', 'fatigue'],
    severity: 'mild',
    commonCauses: ['Viral infection (rhinovirus, coronavirus)', 'Droplet transmission'],
    riskFactors: ['Weak immunity', 'Close contact with infected person', 'Cold weather'],
    treatments: ['Rest', 'Hydration', 'Warm salt water gargling', 'Steam inhalation'],
    medications: ['Paracetamol', 'Antihistamine', 'Expectorant syrup'],
    doList: [
      'Get plenty of rest (7-8 hours sleep)',
      'Drink warm fluids like tea, soup, warm water',
      'Use steam inhalation 2-3 times daily',
      'Gargle with warm salt water',
      'Eat vitamin C rich foods',
      'Maintain hand hygiene'
    ],
    dontList: [
      'Don\'t go to work/school to avoid spreading',
      'Avoid cold foods and drinks',
      'Don\'t share personal items',
      'Avoid smoking and alcohol',
      'Don\'t ignore symptoms if they worsen',
      'Avoid crowded places'
    ],
    followUp: ['If symptoms persist beyond 7 days', 'If fever exceeds 102°F', 'If breathing difficulty develops'],
    diet: ['Warm soups', 'Herbal teas', 'Citrus fruits', 'Honey and ginger', 'Light, easily digestible food']
  },

  'Flu': {
    name: 'Influenza (Flu)',
    symptoms: ['fever', 'headache', 'body_aches', 'fatigue', 'cough', 'sore_throat', 'chills'],
    severity: 'moderate',
    commonCauses: ['Influenza virus A, B, or C', 'Airborne transmission'],
    riskFactors: ['Age extremes', 'Chronic diseases', 'Pregnancy', 'Immunocompromised state'],
    treatments: ['Antiviral medications', 'Symptomatic treatment', 'Rest and hydration'],
    medications: ['Oseltamivir', 'Paracetamol', 'Ibuprofen'],
    doList: [
      'Take complete bed rest for 3-5 days',
      'Drink plenty of fluids (8-10 glasses daily)',
      'Take medications as prescribed',
      'Monitor temperature regularly',
      'Use humidifier if available',
      'Isolate yourself to prevent spread'
    ],
    dontList: [
      'Don\'t return to work until fever-free for 24 hours',
      'Avoid aspirin in children under 18',
      'Don\'t ignore worsening symptoms',
      'Avoid dehydration',
      'Don\'t stop medication early',
      'Avoid close contact with high-risk individuals'
    ],
    followUp: ['If symptoms worsen after 3 days', 'Difficulty breathing', 'Persistent high fever'],
    diet: ['Clear broths', 'Electrolyte solutions', 'Warm herbal teas', 'Light meals', 'Avoid dairy temporarily']
  },

  'Gastritis': {
    name: 'Gastritis',
    symptoms: ['stomach_pain', 'nausea', 'vomiting', 'bloating', 'loss_of_appetite', 'heartburn'],
    severity: 'moderate',
    commonCauses: ['H. pylori infection', 'NSAIDs', 'Alcohol', 'Stress', 'Spicy food'],
    riskFactors: ['Irregular eating', 'Stress', 'Alcohol consumption', 'NSAID use'],
    treatments: ['Acid suppressants', 'Antibiotics if H. pylori', 'Dietary modifications'],
    medications: ['Pantoprazole', 'Ranitidine', 'Antacids'],
    doList: [
      'Eat small, frequent meals (every 2-3 hours)',
      'Take medications before meals',
      'Drink plenty of water between meals',
      'Practice stress management techniques',
      'Sleep with head elevated',
      'Maintain regular meal timings'
    ],
    dontList: [
      'Don\'t eat spicy, oily, or acidic foods',
      'Avoid alcohol and smoking',
      'Don\'t take NSAIDs without prescription',
      'Avoid large meals and late-night eating',
      'Don\'t drink water during meals',
      'Avoid stress and anxiety triggers'
    ],
    followUp: ['If symptoms persist after 1 week', 'Blood in vomit or stool', 'Severe abdominal pain'],
    diet: ['Bland foods', 'Boiled rice', 'Toast', 'Banana', 'Yogurt', 'Avoid citrus and tomatoes']
  },

  'UTI': {
    name: 'Urinary Tract Infection',
    symptoms: ['burning_urination', 'frequent_urination', 'urgency', 'cloudy_urine', 'pelvic_pain'],
    severity: 'moderate',
    commonCauses: ['E. coli bacteria', 'Poor hygiene', 'Sexual activity', 'Catheter use'],
    riskFactors: ['Female gender', 'Sexual activity', 'Pregnancy', 'Diabetes', 'Kidney stones'],
    treatments: ['Antibiotics', 'Increased fluid intake', 'Pain management'],
    medications: ['Nitrofurantoin', 'Trimethoprim', 'Ciprofloxacin'],
    doList: [
      'Drink 8-10 glasses of water daily',
      'Urinate frequently, don\'t hold urine',
      'Maintain proper genital hygiene',
      'Urinate after sexual activity',
      'Take full course of antibiotics',
      'Wear cotton undergarments'
    ],
    dontList: [
      'Don\'t delay urination when you feel the urge',
      'Avoid tight-fitting clothes',
      'Don\'t use scented feminine products',
      'Avoid bubble baths and harsh soaps',
      'Don\'t stop antibiotics early',
      'Avoid caffeine and alcohol'
    ],
    followUp: ['If symptoms persist after 2 days of treatment', 'Blood in urine', 'High fever develops'],
    diet: ['Cranberry juice', 'Plenty of water', 'Avoid spicy foods', 'Reduce sugar intake', 'Light, nutritious meals']
  },

  'Diabetes': {
    name: 'Diabetes Mellitus',
    symptoms: ['excessive_thirst', 'frequent_urination', 'weight_loss', 'fatigue', 'blurred_vision', 'slow_healing'],
    severity: 'severe',
    commonCauses: ['Insulin resistance', 'Pancreatic dysfunction', 'Genetic factors', 'Lifestyle factors'],
    riskFactors: ['Family history', 'Obesity', 'Sedentary lifestyle', 'Age over 45', 'High blood pressure'],
    treatments: ['Blood sugar monitoring', 'Medication compliance', 'Lifestyle modification', 'Regular exercise'],
    medications: ['Metformin', 'Insulin', 'Glibenclamide'],
    doList: [
      'Monitor blood sugar levels regularly',
      'Take medications at prescribed times',
      'Follow diabetic diet strictly',
      'Exercise for 30 minutes daily',
      'Check feet daily for cuts or sores',
      'Maintain healthy weight'
    ],
    dontList: [
      'Don\'t skip meals or medications',
      'Avoid sugary foods and drinks',
      'Don\'t ignore symptoms of high/low blood sugar',
      'Avoid smoking and excessive alcohol',
      'Don\'t walk barefoot',
      'Avoid stress and irregular sleep'
    ],
    followUp: ['Regular HbA1c monitoring every 3 months', 'Annual eye and kidney function tests', 'Immediate care for blood sugar extremes'],
    diet: ['High fiber foods', 'Whole grains', 'Lean proteins', 'Non-starchy vegetables', 'Limited carbohydrates', 'Regular meal timing']
  },

  'Hypertension': {
    name: 'High Blood Pressure',
    symptoms: ['headache', 'dizziness', 'chest_pain', 'shortness_of_breath', 'fatigue', 'vision_problems'],
    severity: 'severe',
    commonCauses: ['Unknown (essential)', 'Kidney disease', 'Hormonal disorders', 'Certain medications'],
    riskFactors: ['Age', 'Family history', 'Obesity', 'High sodium diet', 'Sedentary lifestyle', 'Stress'],
    treatments: ['Lifestyle modifications', 'Antihypertensive medications', 'Regular monitoring', 'Stress management'],
    medications: ['Amlodipine', 'Enalapril', 'Atenolol'],
    doList: [
      'Monitor blood pressure regularly at home',
      'Take medications at the same time daily',
      'Follow DASH diet (low sodium)',
      'Exercise regularly (150 minutes/week)',
      'Maintain healthy weight',
      'Practice stress reduction techniques'
    ],
    dontList: [
      'Don\'t add extra salt to food',
      'Avoid processed and packaged foods',
      'Don\'t skip blood pressure medications',
      'Avoid excessive alcohol consumption',
      'Don\'t smoke or use tobacco',
      'Avoid high-stress situations when possible'
    ],
    followUp: ['Monthly blood pressure monitoring', 'Regular kidney function tests', 'Immediate care for severe hypertension (>180/120)'],
    diet: ['Low sodium foods', 'Fresh fruits and vegetables', 'Lean proteins', 'Whole grains', 'Limited processed foods', 'Potassium-rich foods']
  }
};

export class EnhancedLocalMedicalEngine {
  
  // Advanced symptom extraction with context awareness
  extractSymptoms(text: string): string[] {
    const symptoms = new Set<string>();
    const normalizedText = text.toLowerCase().trim();
    
    // Enhanced symptom patterns with context
    const symptomPatterns = {
      'fever': /\b(fever|temperature|hot|chills|bukhar|बुखार|तेज बुखार)\b/gi,
      'headache': /\b(headache|head pain|sir dard|migraine|सिरदर्द|सिर में दर्द)\b/gi,
      'cough': /\b(cough|coughing|khansi|खांसी|कफ)\b/gi,
      'sore_throat': /\b(sore throat|throat pain|gala kharab|गले में दर्द|गला खराब)\b/gi,
      'runny_nose': /\b(runny nose|nasal discharge|nazla|नाक बहना|नजला)\b/gi,
      'sneezing': /\b(sneezing|chheenk|छींक)\b/gi,
      'stomach_pain': /\b(stomach pain|abdominal pain|pet dard|पेट दर्द|पेट में दर्द)\b/gi,
      'nausea': /\b(nausea|feeling sick|queasy|ulti|जी मिचलाना|मिचली)\b/gi,
      'vomiting': /\b(vomiting|throwing up|ulti|उल्टी)\b/gi,
      'diarrhea': /\b(diarrhea|loose stools|dast|दस्त|loose motion)\b/gi,
      'burning_urination': /(burning.*urinat|painful.*urinat|burn.*pee|pain.*pee|burning.*while.*urinat|pain.*while.*urinat|पेशाब में जलन|peshab mein jalan)/gi,
      'frequent_urination': /\b(frequent.*urinat|bar bar peshab|बार बार पेशाब|urinat.*frequent|often.*urinat)\b/gi,
      'fatigue': /\b(tired|weakness|fatigue|exhausted|kamzori|कमजोरी|थकान)\b/gi,
      'body_aches': /\b(body aches|body pain|muscle pain|badan dard|शरीर दर्द)\b/gi,
      'chest_pain': /\b(chest pain|chest discomfort|सीने में दर्द|seene mein dard)\b/gi,
      'shortness_of_breath': /\b(shortness of breath|difficulty breathing|सांस लेने में तकलीफ|breathless)\b/gi,
      'dizziness': /\b(dizziness|dizzy|lightheaded|chakkar|चक्कर)\b/gi,
      'excessive_thirst': /\b(excessive thirst|increased thirst|zyada pyaas|ज्यादा प्यास)\b/gi,
      'weight_loss': /\b(weight loss|wajan kam|वजन कम होना)\b/gi,
      'blurred_vision': /\b(blurred vision|vision problems|धुंधला दिखना|nazar ki samasya)\b/gi
    };

    // Extract symptoms using regex patterns
    for (const [symptom, pattern] of Object.entries(symptomPatterns)) {
      if (pattern.test(normalizedText)) {
        symptoms.add(symptom);
      }
    }

    // Context-based symptom detection
    if (/\b(pain|dard|दर्द)\b/i.test(normalizedText)) {
      if (/\b(head|sir|सिर)\b/i.test(normalizedText)) symptoms.add('headache');
      if (/\b(stomach|pet|पेट)\b/i.test(normalizedText)) symptoms.add('stomach_pain');
      if (/\b(chest|seena|सीना)\b/i.test(normalizedText)) symptoms.add('chest_pain');
    }

    if (/\b(cold|thanda|जुकाम)\b/i.test(normalizedText)) {
      symptoms.add('runny_nose');
      symptoms.add('sneezing');
      symptoms.add('sore_throat');
    }

    return Array.from(symptoms);
  }

  // Robust disease prediction with scoring algorithm
  predictDisease(symptoms: string[]): {
    disease: string;
    confidence: number;
    matchedSymptoms: string[];
    severity: 'mild' | 'moderate' | 'severe';
  } | null {
    if (!symptoms || symptoms.length === 0) return null;

    let bestMatch = {
      disease: '',
      confidence: 0,
      matchedSymptoms: [] as string[],
      severity: 'mild' as 'mild' | 'moderate' | 'severe'
    };

    for (const [conditionName, condition] of Object.entries(MEDICAL_CONDITIONS)) {
      const matchedSymptoms = symptoms.filter(symptom => 
        condition.symptoms.includes(symptom)
      );

      if (matchedSymptoms.length > 0) {
        // Calculate confidence score
        const symptomMatchRatio = matchedSymptoms.length / condition.symptoms.length;
        const inputCoverageRatio = matchedSymptoms.length / symptoms.length;
        
        // Weighted confidence calculation
        const confidence = Math.round(
          (symptomMatchRatio * 60) + 
          (inputCoverageRatio * 30) + 
          (matchedSymptoms.length >= 3 ? 10 : 0)
        );

        if (confidence > bestMatch.confidence && confidence >= 30) {
          bestMatch = {
            disease: conditionName,
            confidence: Math.min(confidence, 95),
            matchedSymptoms,
            severity: condition.severity
          };
        }
      }
    }

    return bestMatch.confidence > 0 ? bestMatch : null;
  }

  // Get comprehensive treatment recommendations
  getTreatmentRecommendations(disease: string): {
    doList: string[];
    dontList: string[];
    followUp: string[];
    diet: string[];
    medications: string[];
  } {
    const condition = MEDICAL_CONDITIONS[disease];
    if (!condition) {
      return {
        doList: ['Consult with a healthcare professional', 'Rest and stay hydrated', 'Monitor symptoms'],
        dontList: ['Don\'t ignore worsening symptoms', 'Avoid self-medication', 'Don\'t delay medical consultation'],
        followUp: ['If symptoms persist or worsen', 'Regular medical check-ups'],
        diet: ['Balanced, nutritious diet', 'Stay hydrated', 'Avoid processed foods'],
        medications: ['As prescribed by healthcare provider']
      };
    }

    return {
      doList: condition.doList,
      dontList: condition.dontList,
      followUp: condition.followUp,
      diet: condition.diet,
      medications: condition.medications
    };
  }

  // Generate comprehensive medical advice
  generateComprehensiveAdvice(
    symptoms: string[],
    prediction: any,
    patientDetails: any
  ): string {
    const condition = MEDICAL_CONDITIONS[prediction.disease];
    if (!condition) {
      return `Based on your symptoms, I recommend consulting with a healthcare professional for proper evaluation and treatment. Please monitor your symptoms and seek medical attention if they worsen.`;
    }

    let advice = `**DIAGNOSIS: ${condition.name}**\n\n`;
    advice += `**CONFIDENCE: ${prediction.confidence}%**\n\n`;
    advice += `**SYMPTOMS IDENTIFIED:** ${prediction.matchedSymptoms.join(', ')}\n\n`;
    
    advice += `**WHAT TO DO:**\n`;
    condition.doList.forEach((item, index) => {
      advice += `${index + 1}. ${item}\n`;
    });
    
    advice += `\n**WHAT NOT TO DO:**\n`;
    condition.dontList.forEach((item, index) => {
      advice += `${index + 1}. ${item}\n`;
    });
    
    advice += `\n**DIET RECOMMENDATIONS:**\n`;
    condition.diet.forEach((item, index) => {
      advice += `${index + 1}. ${item}\n`;
    });
    
    advice += `\n**FOLLOW-UP CARE:**\n`;
    condition.followUp.forEach((item, index) => {
      advice += `${index + 1}. ${item}\n`;
    });

    advice += `\n**SEVERITY:** ${condition.severity.toUpperCase()}\n`;
    advice += `\n**IMPORTANT:** This is an AI-generated assessment. Please consult with a qualified healthcare professional for proper diagnosis and treatment.`;

    return advice;
  }
}

export const enhancedLocalMedicalEngine = new EnhancedLocalMedicalEngine();