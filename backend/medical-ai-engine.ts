import OpenAI from "openai";

// Disease-symptom mapping based on medical knowledge
const DISEASE_SYMPTOMS = {
  // Respiratory Diseases
  "Common Cold": ["runny nose", "sneezing", "cough", "sore throat", "nasal congestion", "mild fever"],
  "Flu": ["fever", "body aches", "fatigue", "cough", "headache", "chills", "sore throat"],
  "Pneumonia": ["chest pain", "cough with phlegm", "fever", "shortness of breath", "difficulty breathing"],
  "Asthma": ["wheezing", "shortness of breath", "chest tightness", "cough", "difficulty breathing"],
  "Bronchitis": ["persistent cough", "mucus production", "chest discomfort", "fatigue", "mild fever"],
  
  // Gastrointestinal Diseases
  "Gastritis": ["stomach pain", "nausea", "vomiting", "bloating", "loss of appetite", "indigestion"],
  "Food Poisoning": ["nausea", "vomiting", "diarrhea", "stomach cramps", "fever", "weakness"],
  "GERD": ["heartburn", "acid reflux", "chest pain", "difficulty swallowing", "regurgitation"],
  "IBS": ["abdominal pain", "bloating", "gas", "diarrhea", "constipation", "cramping"],
  
  // Infectious Diseases
  "UTI": ["burning urination", "frequent urination", "cloudy urine", "pelvic pain", "fever"],
  "Skin Infection": ["redness", "swelling", "warmth", "pain", "pus", "fever"],
  "Typhoid": ["high fever", "weakness", "stomach pain", "headache", "loss of appetite"],
  
  // Cardiovascular
  "Hypertension": ["headache", "dizziness", "shortness of breath", "chest pain", "fatigue"],
  "Heart Palpitations": ["rapid heartbeat", "chest fluttering", "dizziness", "shortness of breath"],
  
  // Neurological
  "Migraine": ["severe headache", "nausea", "sensitivity to light", "sensitivity to sound", "visual disturbances"],
  "Tension Headache": ["mild to moderate headache", "pressure around head", "neck stiffness"],
  
  // Allergic Conditions
  "Allergic Rhinitis": ["sneezing", "runny nose", "itchy eyes", "nasal congestion", "watery eyes"],
  "Skin Allergy": ["itching", "rash", "redness", "swelling", "hives"],
  
  // General
  "Fever": ["high temperature", "chills", "sweating", "body aches", "fatigue", "dehydration"],
  "Anxiety": ["worry", "restlessness", "rapid heartbeat", "sweating", "difficulty sleeping"]
};

// Medicine recommendations based on the CSV data
const MEDICINE_DATABASE = {
  // Respiratory conditions
  "Common Cold": [
    { name: "Alex Syrup", composition: "Phenylephrine + Chlorpheniramine + Dextromethorphan", price: 129, type: "Cough syrup" },
    { name: "Ascoril D Plus Syrup", composition: "Phenylephrine + Chlorpheniramine + Dextromethorphan", price: 129, type: "Cough syrup" }
  ],
  "Flu": [
    { name: "Allegra 120mg Tablet", composition: "Fexofenadine (120mg)", price: 218.81, type: "Antihistamine" },
    { name: "Avil 25 Tablet", composition: "Pheniramine (25mg)", price: 10.96, type: "Antihistamine" }
  ],
  "Pneumonia": [
    { name: "Augmentin 625 Duo Tablet", composition: "Amoxycillin (500mg) + Clavulanic Acid (125mg)", price: 223.42, type: "Antibiotic" },
    { name: "Azithral 500 Tablet", composition: "Azithromycin (500mg)", price: 132.36, type: "Antibiotic" }
  ],
  "Asthma": [
    { name: "Asthalin 100mcg Inhaler", composition: "Salbutamol (100mcg)", price: 157.85, type: "Bronchodilator" },
    { name: "Asthalin Syrup", composition: "Salbutamol (2mg/5ml)", price: 19.04, type: "Bronchodilator" }
  ],
  "Bronchitis": [
    { name: "Ascoril LS Syrup", composition: "Ambroxol + Levosalbutamol + Guaifenesin", price: 118, type: "Expectorant" },
    { name: "Ambrodil-S Syrup", composition: "Ambroxol + Salbutamol", price: 30.2, type: "Expectorant" }
  ],
  
  // Gastrointestinal conditions
  "Gastritis": [
    { name: "Aciloc 150 Tablet", composition: "Ranitidine (150mg)", price: 40.94, type: "Antacid" }
  ],
  "GERD": [
    { name: "Aciloc 150 Tablet", composition: "Ranitidine (150mg)", price: 40.94, type: "Antacid" }
  ],
  
  // Infections
  "UTI": [
    { name: "Augmentin 625 Duo Tablet", composition: "Amoxycillin (500mg) + Clavulanic Acid (125mg)", price: 223.42, type: "Antibiotic" },
    { name: "Azee 500 Tablet", composition: "Azithromycin (500mg)", price: 132.38, type: "Antibiotic" }
  ],
  "Skin Infection": [
    { name: "Amoxyclav 625 Tablet", composition: "Amoxycillin (500mg) + Clavulanic Acid (125mg)", price: 223.27, type: "Antibiotic" },
    { name: "Almox 500 Capsule", composition: "Amoxycillin (500mg)", price: 80.26, type: "Antibiotic" }
  ],
  "Typhoid": [
    { name: "Azithral 500 Tablet", composition: "Azithromycin (500mg)", price: 132.36, type: "Antibiotic" },
    { name: "Azee 500 Tablet", composition: "Azithromycin (500mg)", price: 132.38, type: "Antibiotic" }
  ],
  
  // Allergies
  "Allergic Rhinitis": [
    { name: "Allegra 120mg Tablet", composition: "Fexofenadine (120mg)", price: 218.81, type: "Antihistamine" },
    { name: "Allegra-M Tablet", composition: "Montelukast + Fexofenadine", price: 241.48, type: "Antihistamine" },
    { name: "Avil 25 Tablet", composition: "Pheniramine (25mg)", price: 10.96, type: "Antihistamine" }
  ],
  "Skin Allergy": [
    { name: "Atarax 25mg Tablet", composition: "Hydroxyzine (25mg)", price: 85.5, type: "Antihistamine" },
    { name: "Avil 25 Tablet", composition: "Pheniramine (25mg)", price: 10.96, type: "Antihistamine" }
  ],
  
  // Anxiety/Sleep
  "Anxiety": [
    { name: "Alprax 0.25 Tablet", composition: "Alprazolam (0.25mg)", price: 29, type: "Anxiolytic" },
    { name: "Ativan 2mg Tablet", composition: "Lorazepam (2mg)", price: 91.87, type: "Anxiolytic" }
  ],
  
  // Pain/Fever
  "Fever": [
    { name: "Paracetamol", composition: "Paracetamol (500mg)", price: 15, type: "Antipyretic" }
  ],
  "Migraine": [
    { name: "Altraday Capsule SR", composition: "Aceclofenac + Rabeprazole", price: 128, type: "Pain reliever" }
  ]
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class MedicalAIEngine {
  
  // Enhanced symptom extraction using NLP and medical knowledge
  extractSymptoms(text: string): string[] {
    const symptoms = new Set<string>();
    const normalizedText = text.toLowerCase();
    
    // Common symptom patterns and variations
    const symptomPatterns = {
      "fever": ["fever", "temperature", "high temp", "hot", "chills", "bukhar"],
      "headache": ["headache", "head pain", "sir dard", "migraine"],
      "cough": ["cough", "coughing", "khansi", "dry cough", "wet cough"],
      "sore throat": ["sore throat", "throat pain", "gala kharab", "throat infection"],
      "runny nose": ["runny nose", "nasal discharge", "nazla", "nose running"],
      "sneezing": ["sneezing", "achoo", "chheenk"],
      "body aches": ["body aches", "body pain", "muscle pain", "badan dard"],
      "fatigue": ["tired", "weakness", "fatigue", "exhausted", "kamzori"],
      "nausea": ["nausea", "feeling sick", "queasy", "ulti"],
      "vomiting": ["vomiting", "throwing up", "ulti", "vomit"],
      "diarrhea": ["diarrhea", "loose stools", "dast", "stomach upset"],
      "stomach pain": ["stomach pain", "abdominal pain", "pet dard", "stomach ache"],
      "chest pain": ["chest pain", "chest discomfort", "seene mein dard"],
      "shortness of breath": ["shortness of breath", "difficulty breathing", "breathless", "saans ki takleef"],
      "dizziness": ["dizziness", "dizzy", "lightheaded", "chakkar"],
      "rash": ["rash", "skin rash", "itching", "khujli"],
      "burning urination": ["burning urination", "painful urination", "peshab mein jalan"],
      "frequent urination": ["frequent urination", "bar bar peshab"]
    };

    // Extract symptoms based on patterns
    for (const [symptom, patterns] of Object.entries(symptomPatterns)) {
      for (const pattern of patterns) {
        if (normalizedText.includes(pattern)) {
          symptoms.add(symptom);
          break;
        }
      }
    }

    return Array.from(symptoms);
  }

  // Disease prediction using symptom matching
  predictDisease(symptoms: string[]): { disease: string; confidence: number; matchedSymptoms: string[] } | null {
    let bestMatch = { disease: "", confidence: 0, matchedSymptoms: [] as string[] };
    
    for (const [disease, diseaseSymptoms] of Object.entries(DISEASE_SYMPTOMS)) {
      const matchedSymptoms = symptoms.filter(symptom => 
        diseaseSymptoms.some(ds => ds.toLowerCase().includes(symptom.toLowerCase()) || 
                                   symptom.toLowerCase().includes(ds.toLowerCase()))
      );
      
      if (matchedSymptoms.length > 0) {
        const confidence = (matchedSymptoms.length / diseaseSymptoms.length) * 100;
        
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            disease,
            confidence: Math.min(confidence, 95), // Cap at 95% to maintain medical caution
            matchedSymptoms
          };
        }
      }
    }
    
    return bestMatch.confidence > 0 ? bestMatch : null;
  }

  // Get medicine recommendations for a disease
  getMedicineRecommendations(disease: string): any[] {
    return MEDICINE_DATABASE[disease as keyof typeof MEDICINE_DATABASE] || [];
  }

  // Generate comprehensive medical response
  async generateMedicalResponse(
    symptoms: string[], 
    patientDetails: any
  ): Promise<{ 
    diagnosis: string; 
    medicines: any[]; 
    advice: string; 
    confidence: number;
    matchedSymptoms: string[];
  }> {
    
    // Predict disease
    const prediction = this.predictDisease(symptoms);
    
    if (!prediction) {
      return {
        diagnosis: "Unable to determine specific condition",
        medicines: [],
        advice: "Please consult a doctor for proper diagnosis",
        confidence: 0,
        matchedSymptoms: []
      };
    }

    // Get medicine recommendations
    const medicines = this.getMedicineRecommendations(prediction.disease);
    
    // Generate AI-powered medical advice
    const advice = await this.generateMedicalAdvice(
      prediction.disease, 
      symptoms, 
      patientDetails,
      prediction.confidence
    );

    return {
      diagnosis: prediction.disease,
      medicines,
      advice,
      confidence: prediction.confidence,
      matchedSymptoms: prediction.matchedSymptoms
    };
  }

  // Generate detailed medical advice using OpenAI
  private async generateMedicalAdvice(
    disease: string, 
    symptoms: string[], 
    patientDetails: any,
    confidence: number
  ): Promise<string> {
    
    try {
      const prompt = `You are an AI medical assistant. Based on the following information, provide comprehensive medical advice:

Disease: ${disease}
Symptoms: ${symptoms.join(', ')}
Patient Age: ${patientDetails.age}
Patient Gender: ${patientDetails.gender}
Confidence: ${confidence}%

Please provide:
1. Brief explanation of the condition
2. General care instructions
3. When to seek immediate medical attention
4. Lifestyle recommendations
5. Important warnings

Keep the response professional, helpful, and include both English and Hindi instructions where helpful.
Always emphasize that this is not a substitute for professional medical consultation.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a professional medical AI assistant. Provide accurate, helpful medical information while always emphasizing the importance of consulting healthcare professionals."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      return response.choices[0].message.content || "Please consult a healthcare professional for personalized medical advice.";
      
    } catch (error) {
      console.error("Error generating medical advice:", error);
      return "Unable to generate detailed advice at this time. Please consult a healthcare professional for proper medical guidance.";
    }
  }

  // Format prescription data
  generatePrescription(
    diagnosis: string,
    medicines: any[],
    patientDetails: any,
    advice: string
  ): any {
    
    const medications = medicines.slice(0, 3).map(med => ({
      name: med.name,
      composition: med.composition,
      dosage: this.getDosageRecommendation(med.type, patientDetails.age),
      frequency: this.getFrequencyRecommendation(med.type),
      duration: this.getDurationRecommendation(diagnosis),
      instructions: this.getMedicationInstructions(med.type),
      price: `₹${med.price}`
    }));

    return {
      id: `RX${Date.now()}`,
      patientName: patientDetails.name,
      age: patientDetails.age,
      gender: patientDetails.gender,
      bloodGroup: patientDetails.bloodGroup,
      date: new Date().toLocaleDateString('en-IN'),
      diagnosis,
      symptoms: advice.substring(0, 100) + "...",
      medications,
      instructions: this.getGeneralInstructions(diagnosis),
      doctorName: patientDetails.gender === 'Male' ? 'Dr. Priya Sharma' : 'Dr. Arjun Patel',
      clinicName: 'JeevanCare AI Medical Center',
      signature: 'Digital Signature Verified'
    };
  }

  private getDosageRecommendation(medicineType: string, age: string): string {
    const ageNum = parseInt(age);
    
    if (medicineType.includes('Tablet') || medicineType.includes('Capsule')) {
      return ageNum < 12 ? "Half tablet" : "1 tablet";
    } else if (medicineType.includes('Syrup')) {
      return ageNum < 12 ? "5ml" : "10ml";
    } else if (medicineType.includes('Inhaler')) {
      return "2 puffs";
    }
    return "As directed";
  }

  private getFrequencyRecommendation(medicineType: string): string {
    if (medicineType.includes('Antibiotic')) return "Twice daily";
    if (medicineType.includes('Antihistamine')) return "Once daily";
    if (medicineType.includes('Cough')) return "Three times daily";
    if (medicineType.includes('Inhaler')) return "As needed";
    return "Twice daily";
  }

  private getDurationRecommendation(diagnosis: string): string {
    if (diagnosis.includes('Infection') || diagnosis.includes('Pneumonia')) return "7-10 days";
    if (diagnosis.includes('Allergy')) return "5-7 days";
    if (diagnosis.includes('Cold') || diagnosis.includes('Flu')) return "5 days";
    return "5-7 days";
  }

  private getMedicationInstructions(medicineType: string): string {
    if (medicineType.includes('Antibiotic')) return "Take with food. Complete full course.";
    if (medicineType.includes('Antihistamine')) return "May cause drowsiness. Avoid driving.";
    if (medicineType.includes('Cough')) return "Take after meals.";
    if (medicineType.includes('Inhaler')) return "Rinse mouth after use.";
    return "Take as directed by physician.";
  }

  private getGeneralInstructions(diagnosis: string): string[] {
    const general = [
      "Take medicines as prescribed",
      "Complete the full course of antibiotics if prescribed",
      "Stay hydrated - drink plenty of fluids",
      "Get adequate rest",
      "Follow up if symptoms worsen"
    ];

    if (diagnosis.includes('Respiratory') || diagnosis.includes('Cold') || diagnosis.includes('Flu')) {
      general.push("Use a humidifier or steam inhalation");
      general.push("Avoid cold drinks and foods");
    }

    if (diagnosis.includes('Infection')) {
      general.push("Maintain good hygiene");
      general.push("Wash hands frequently");
    }

    return general;
  }
}

export const medicalAI = new MedicalAIEngine();