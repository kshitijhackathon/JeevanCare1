// Comprehensive disease database with Hinglish variations
export const DISEASE_DATABASE = {
  "malaria": {
    "hinglish": ["मलेरिया", "maleria", "bukhar wali bimari", "machhar wala bukhar"],
    "medication": "Antimalarials (Chloroquine, Artemisinin)",
    "warning": "Prevent mosquito bites, avoid stagnant water"
  },
  "dengue": {
    "hinglish": ["डेंगू", "dengu", "platelet kam hona", "haddi tod bukhar"],
    "medication": "Hydration, Paracetamol (avoid Aspirin)",
    "warning": "Platelet monitoring, no NSAIDs"
  },
  "typhoid": {
    "hinglish": ["टायफाइड", "taifoid", "pani wala bukhar"],
    "medication": "Antibiotics (Ciprofloxacin, Azithromycin)",
    "warning": "Boil water, hygiene important"
  },
  "tuberculosis": {
    "hinglish": ["टीबी", "tb", "tuberculosis", "khaansi wali bimari", "phephdo ka rog"],
    "medication": "DOTS therapy (Rifampin, Isoniazid)",
    "warning": "Complete course, avoid alcohol"
  },
  "cholera": {
    "hinglish": ["हैजा", "haija", "ultii dast ki bimari"],
    "medication": "ORS, Antibiotics (Doxycycline)",
    "warning": "Drink clean water, hygiene"
  },
  "hypertension": {
    "hinglish": ["हाई बीपी", "high bp", "bp badhna", "blood pressure"],
    "medication": "Beta-blockers (Atenolol), ACE inhibitors",
    "warning": "Low salt, regular checkup"
  },
  "diabetes": {
    "hinglish": ["शुगर", "sugar", "sugar ki bimari", "blood sugar"],
    "medication": "Metformin, Insulin",
    "warning": "Avoid sweets, exercise"
  },
  "asthma": {
    "hinglish": ["दमा", "asthma", "saans ki takleef", "inhaler wali bimari"],
    "medication": "Inhalers (Salbutamol)",
    "warning": "Avoid dust, smoke"
  },
  "migraine": {
    "hinglish": ["माइग्रेन", "migraine", "sirdard", "headache", "dimaag phatna"],
    "medication": "Painkillers (Sumatriptan)",
    "warning": "Avoid triggers"
  },
  "acidity": {
    "hinglish": ["एसिडिटी", "acid", "pet me jalan", "ultee jaisi feeling"],
    "medication": "Antacids (Pantoprazole)",
    "warning": "Avoid spicy food"
  },
  "fever": {
    "hinglish": ["बुखार", "bukhar", "tap", "fever", "temperature", "garmi"],
    "medication": "Paracetamol 500mg every 6 hours",
    "warning": "Stay hydrated, rest completely"
  },
  "cough": {
    "hinglish": ["खांसी", "khaansi", "khasi", "cough"],
    "medication": "Honey ginger tea, Cough syrup",
    "warning": "Avoid cold drinks"
  },
  "stomach_pain": {
    "hinglish": ["पेट दर्द", "pet dard", "paet dard", "stomach pain"],
    "medication": "Antispasmodic, avoid spicy food",
    "warning": "Light diet, plenty of water"
  },
  "diarrhea": {
    "hinglish": ["दस्त", "dast", "loose motion", "patlaa", "toilet"],
    "medication": "ORS solution, Loperamide",
    "warning": "Stay hydrated, avoid dairy"
  },
  "vomiting": {
    "hinglish": ["उल्टी", "ulti", "qaai", "vomit", "throwing up"],
    "medication": "Domperidone, ORS",
    "warning": "Small frequent sips of water"
  }
};

// Enhanced symptom mapping
export const symptomMap = {
  // Pain variations
  "dard": "pain",
  "takleef": "discomfort", 
  "peeda": "pain",
  "kasht": "pain",
  "vedana": "pain",
  
  // Fever variations
  "bukhar": "fever",
  "bukhaar": "fever",
  "tap": "fever",
  "temperature": "fever",
  "garmi": "fever",
  
  // Digestive issues
  "pet": "stomach",
  "paet": "stomach", 
  "ulti": "vomiting",
  "qaai": "vomiting",
  "dast": "diarrhea",
  "loose motion": "diarrhea",
  "patlaa": "diarrhea",
  
  // Respiratory
  "khansi": "cough",
  "khasi": "cough",
  "zukaam": "cold",
  "jukam": "cold",
  "nazla": "cold",
  "saas": "breathing",
  
  // Body parts
  "sar": "head",
  "sir": "head", 
  "seena": "chest",
  "sina": "chest",
  "gala": "throat",
  "kamr": "back",
  "kamar": "back",
  
  // Burning/irritation
  "jalan": "burning",
  "jalaa": "burning",
  "sooja": "swelling",
  "soojan": "swelling"
};

// Enhanced disease detection using comprehensive database
export function detectDiseaseFromText(text) {
  const normalizedText = text.toLowerCase();
  
  for (const [disease, info] of Object.entries(DISEASE_DATABASE)) {
    for (const keyword of info.hinglish) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        return {
          disease: disease,
          medication: info.medication,
          warning: info.warning,
          confidence: 0.95,
          matchedKeyword: keyword
        };
      }
    }
  }
  return null;
}

export function detectSymptomsFromText(text) {
  const normalizedText = text.toLowerCase();
  const detectedSymptoms = [];
  const context = {
    location: null,
    duration: null,
    severity: null,
    symptoms: [],
    detectedDisease: null
  };
  
  // First, try to detect specific diseases
  const diseaseResult = detectDiseaseFromText(text);
  if (diseaseResult) {
    context.detectedDisease = diseaseResult;
    detectedSymptoms.push({
      original: diseaseResult.matchedKeyword,
      normalized: diseaseResult.disease,
      confidence: diseaseResult.confidence,
      type: 'disease'
    });
  }
  
  // Extract symptoms using mapping
  Object.entries(symptomMap).forEach(([hindiTerm, englishTerm]) => {
    if (normalizedText.includes(hindiTerm)) {
      detectedSymptoms.push({
        original: hindiTerm,
        normalized: englishTerm,
        confidence: 0.9,
        type: 'symptom'
      });
    }
  });
  
  // Extract duration
  const durationPatterns = [
    { pattern: /(\d+)\s*(din|day|days)/gi, value: 'days' },
    { pattern: /(kal se|yesterday|since yesterday)/gi, value: '1 day' },
    { pattern: /(parsho se|day before)/gi, value: '2 days' },
    { pattern: /(hafte se|week|weeks)/gi, value: 'weeks' },
    { pattern: /(mahine se|month)/gi, value: 'months' }
  ];
  
  durationPatterns.forEach(({ pattern, value }) => {
    const match = normalizedText.match(pattern);
    if (match) {
      context.duration = value;
    }
  });
  
  // Extract severity
  const severityPatterns = {
    'severe': ['bahut', 'zyada', 'tej', 'extreme', 'very', 'unbearable'],
    'moderate': ['moderate', 'medium', 'normal', 'manageable'],
    'mild': ['thoda', 'halka', 'kam', 'little', 'mild', 'slight']
  };
  
  Object.entries(severityPatterns).forEach(([severity, keywords]) => {
    if (keywords.some(keyword => normalizedText.includes(keyword))) {
      context.severity = severity;
    }
  });
  
  context.symptoms = detectedSymptoms;
  return context;
}

export function generateContextualResponse(symptoms, context, patientDetails) {
  const { language } = patientDetails;
  
  if (symptoms.length === 0) {
    return language === 'hindi' 
      ? "Kripaya apne symptoms detail mein bataaiye. Kya problem hai?"
      : "Please describe your symptoms in detail. What seems to be the problem?";
  }
  
  let response = '';
  
  // If specific disease detected, provide targeted response
  if (context.detectedDisease) {
    const disease = context.detectedDisease;
    
    if (language === 'hindi') {
      response = `Aapke symptoms ke basis par lagta hai ki aapko **${disease.disease}** ki problem hai. `;
      response += `\n\n**Recommended Treatment:**\n${disease.medication}\n\n`;
      response += `**Important Warning:**\n${disease.warning}\n\n`;
      response += `Kya aur koi symptoms hain? Duration kitni hai?`;
    } else {
      response = `Based on your symptoms, it appears you may have **${disease.disease}**. `;
      response += `\n\n**Recommended Treatment:**\n${disease.medication}\n\n`;
      response += `**Important Warning:**\n${disease.warning}\n\n`;
      response += `Do you have any other symptoms? How long have you been experiencing this?`;
    }
  } else {
    // General symptom response
    const symptomList = symptoms.map(s => s.normalized).join(', ');
    
    if (language === 'hindi') {
      response = `Main samajh gaya ki aapko ${symptomList} ki problem hai`;
      
      if (context.duration) {
        response += ` jo ${context.duration} se ho rahi hai`;
      }
      
      if (context.severity) {
        response += ` aur yeh ${context.severity} level ki hai`;
      }
      
      response += '. ';
      
      // Add specific follow-up questions
      if (symptoms.some(s => s.normalized.includes('pain'))) {
        response += 'Dard kahan exact hai aur kab zyada hota hai? ';
      }
      
      if (symptoms.some(s => s.normalized.includes('fever'))) {
        response += 'Temperature kitna hai? Thand lag rahi hai? ';
      }
      
    } else {
      response = `I understand you have ${symptomList}`;
      
      if (context.duration) {
        response += ` for ${context.duration}`;
      }
      
      if (context.severity) {
        response += ` with ${context.severity} intensity`;
      }
      
      response += '. ';
      
      // Add specific follow-up questions
      if (symptoms.some(s => s.normalized.includes('pain'))) {
        response += 'Where exactly is the pain and when does it worsen? ';
      }
      
      if (symptoms.some(s => s.normalized.includes('fever'))) {
        response += 'What is your temperature? Are you experiencing chills? ';
      }
    }
  }
  
  return response;
}

export function generateMedicationSuggestions(symptoms, severity = 'moderate') {
  const medications = [];
  
  symptoms.forEach(symptom => {
    const normalizedSymptom = symptom.normalized;
    
    if (normalizedSymptom.includes('fever')) {
      medications.push({
        name: 'Paracetamol',
        dosage: severity === 'severe' ? '650mg' : '500mg',
        frequency: 'Every 6-8 hours',
        duration: '3-5 days',
        instructions: 'Take with food'
      });
    }
    
    if (normalizedSymptom.includes('pain')) {
      medications.push({
        name: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'Every 8 hours',
        duration: '3-5 days',
        instructions: 'Take after meals'
      });
    }
    
    if (normalizedSymptom.includes('cough')) {
      medications.push({
        name: 'Honey and ginger tea',
        dosage: '1 teaspoon honey',
        frequency: '3 times daily',
        duration: '1 week',
        instructions: 'Natural remedy, safe for all ages'
      });
    }
    
    if (normalizedSymptom.includes('stomach') || normalizedSymptom.includes('vomiting')) {
      medications.push({
        name: 'ORS solution',
        dosage: '1 packet in 200ml water',
        frequency: 'After each loose motion',
        duration: 'Until symptoms improve',
        instructions: 'Prevents dehydration'
      });
    }
  });
  
  return medications;
}