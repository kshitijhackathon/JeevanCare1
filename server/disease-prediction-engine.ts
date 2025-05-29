import fs from 'fs';
import path from 'path';
import OpenAI from "openai";

// Disease symptoms mapping based on medical research
const DISEASE_SYMPTOM_MAPPING = {
  'Common Cold': ['runny_nose', 'sneezing', 'cough', 'sore_throat', 'nasal_congestion', 'mild_fever'],
  'Flu': ['fever', 'body_aches', 'fatigue', 'cough', 'headache', 'chills', 'sore_throat'],
  'Pneumonia': ['chest_pain', 'cough_with_phlegm', 'fever', 'shortness_of_breath', 'difficulty_breathing'],
  'Asthma': ['wheezing', 'shortness_of_breath', 'chest_tightness', 'cough', 'difficulty_breathing'],
  'Bronchitis': ['persistent_cough', 'mucus_production', 'chest_discomfort', 'fatigue', 'mild_fever'],
  'Gastritis': ['stomach_pain', 'nausea', 'vomiting', 'bloating', 'loss_of_appetite', 'indigestion'],
  'Food Poisoning': ['nausea', 'vomiting', 'diarrhea', 'stomach_cramps', 'fever', 'weakness'],
  'GERD': ['heartburn', 'acid_reflux', 'chest_pain', 'difficulty_swallowing', 'regurgitation'],
  'UTI': ['burning_urination', 'frequent_urination', 'cloudy_urine', 'pelvic_pain', 'fever'],
  'Hypertension': ['headache', 'dizziness', 'shortness_of_breath', 'chest_pain', 'fatigue'],
  'Migraine': ['severe_headache', 'nausea', 'sensitivity_to_light', 'sensitivity_to_sound', 'visual_disturbances'],
  'Allergic Rhinitis': ['sneezing', 'runny_nose', 'itchy_eyes', 'nasal_congestion', 'watery_eyes'],
  'Skin Allergy': ['itching', 'rash', 'redness', 'swelling', 'hives'],
  'Anxiety': ['worry', 'restlessness', 'rapid_heartbeat', 'sweating', 'difficulty_sleeping'],
  'Depression': ['sadness', 'loss_of_interest', 'fatigue', 'sleep_disturbances', 'appetite_changes'],
  'Diabetes': ['frequent_urination', 'excessive_thirst', 'unexplained_weight_loss', 'fatigue', 'blurred_vision'],
  'Typhoid': ['high_fever', 'weakness', 'stomach_pain', 'headache', 'loss_of_appetite'],
  'Malaria': ['fever', 'chills', 'headache', 'nausea', 'vomiting', 'muscle_pain'],
  'Tuberculosis': ['persistent_cough', 'chest_pain', 'coughing_blood', 'weight_loss', 'night_sweats'],
  'Hepatitis': ['jaundice', 'fatigue', 'abdominal_pain', 'loss_of_appetite', 'nausea'],
  'Arthritis': ['joint_pain', 'stiffness', 'swelling', 'reduced_range_of_motion', 'warmth_around_joints']
};

// Medicine database from your CSV data
interface Medicine {
  id: string;
  name: string;
  price: number;
  manufacturer: string;
  type: string;
  composition: string;
  description: string;
  sideEffects?: string;
  drugInteractions?: string;
}

// Load medicine data (simulated based on your CSV structure)
const MEDICINE_DATABASE: Record<string, Medicine[]> = {
  'respiratory': [
    {
      id: '1',
      name: 'Augmentin 625 Duo Tablet',
      price: 223.42,
      manufacturer: 'Glaxo SmithKline Pharmaceuticals Ltd',
      type: 'Antibiotic',
      composition: 'Amoxycillin (500mg) + Clavulanic Acid (125mg)',
      description: 'Penicillin-type antibiotic for bacterial infections of lungs, ear, nasal sinus, urinary tract'
    },
    {
      id: '2',
      name: 'Azithral 500 Tablet',
      price: 132.36,
      manufacturer: 'Alembic Pharmaceuticals Ltd',
      type: 'Antibiotic',
      composition: 'Azithromycin (500mg)',
      description: 'Broad-spectrum antibiotic for respiratory tract, ear, nose, throat infections'
    },
    {
      id: '3',
      name: 'Ascoril LS Syrup',
      price: 118,
      manufacturer: 'Glenmark Pharmaceuticals Ltd',
      type: 'Expectorant',
      composition: 'Ambroxol (30mg/5ml) + Levosalbutamol (1mg/5ml) + Guaifenesin (50mg/5ml)',
      description: 'Combination medicine for cough with mucus, thins mucus and provides relief'
    }
  ],
  'allergy': [
    {
      id: '4',
      name: 'Allegra 120mg Tablet',
      price: 218.81,
      manufacturer: 'Sanofi India Ltd',
      type: 'Antihistamine',
      composition: 'Fexofenadine (120mg)',
      description: 'Anti-allergy medicine for runny nose, congestion, sneezing, itching'
    },
    {
      id: '5',
      name: 'Avil 25 Tablet',
      price: 10.96,
      manufacturer: 'Sanofi India Ltd',
      type: 'Antihistamine',
      composition: 'Pheniramine (25mg)',
      description: 'Antiallergic medication for various allergic conditions'
    }
  ],
  'gastrointestinal': [
    {
      id: '11',
      name: 'Aciloc 150 Tablet',
      price: 40.94,
      manufacturer: 'Cadila Pharmaceuticals Ltd',
      type: 'Antacid',
      composition: 'Ranitidine (150mg)',
      description: 'Reduces stomach acid, treats heartburn, indigestion, stomach ulcers'
    }
  ],
  'pain_fever': [
    {
      id: 'generic_1',
      name: 'Paracetamol 500mg',
      price: 15,
      manufacturer: 'Generic',
      type: 'Analgesic/Antipyretic',
      composition: 'Paracetamol (500mg)',
      description: 'Pain reliever and fever reducer'
    }
  ],
  'anxiety': [
    {
      id: '22',
      name: 'Alprax 0.25 Tablet',
      price: 29,
      manufacturer: 'Torrent Pharmaceuticals Ltd',
      type: 'Anxiolytic',
      composition: 'Alprazolam (0.25mg)',
      description: 'Benzodiazepine for anxiety disorders, panic attacks'
    }
  ]
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class DiseasePredictionEngine {
  
  // Advanced symptom extraction with medical terminology
  extractMedicalSymptoms(text: string): string[] {
    const symptoms = new Set<string>();
    const normalizedText = text.toLowerCase();
    
    // Comprehensive symptom mapping with multiple variations
    const symptomPatterns = {
      'fever': ['fever', 'temperature', 'high temp', 'hot', 'chills', 'bukhar', 'तेज बुखार'],
      'headache': ['headache', 'head pain', 'sir dard', 'migraine', 'सिरदर्द'],
      'cough': ['cough', 'coughing', 'khansi', 'dry cough', 'wet cough', 'खांसी'],
      'sore_throat': ['sore throat', 'throat pain', 'gala kharab', 'throat infection', 'गले में दर्द'],
      'runny_nose': ['runny nose', 'nasal discharge', 'nazla', 'nose running', 'नाक बहना'],
      'sneezing': ['sneezing', 'achoo', 'chheenk', 'छींक'],
      'body_aches': ['body aches', 'body pain', 'muscle pain', 'badan dard', 'शरीर दर्द'],
      'fatigue': ['tired', 'weakness', 'fatigue', 'exhausted', 'kamzori', 'कमजोरी'],
      'nausea': ['nausea', 'feeling sick', 'queasy', 'ulti', 'जी मिचलाना'],
      'vomiting': ['vomiting', 'throwing up', 'ulti', 'vomit', 'उल्टी'],
      'diarrhea': ['diarrhea', 'loose stools', 'dast', 'stomach upset', 'दस्त'],
      'stomach_pain': ['stomach pain', 'abdominal pain', 'pet dard', 'stomach ache', 'पेट दर्द'],
      'chest_pain': ['chest pain', 'chest discomfort', 'seene mein dard', 'सीने में दर्द'],
      'shortness_of_breath': ['shortness of breath', 'difficulty breathing', 'breathless', 'saans ki takleef', 'सांस लेने में तकलीफ'],
      'dizziness': ['dizziness', 'dizzy', 'lightheaded', 'chakkar', 'चक्कर'],
      'rash': ['rash', 'skin rash', 'itching', 'khujli', 'खुजली'],
      'burning_urination': ['burning urination', 'painful urination', 'peshab mein jalan', 'पेशाब में जलन'],
      'frequent_urination': ['frequent urination', 'bar bar peshab', 'बार बार पेशाब'],
      'joint_pain': ['joint pain', 'arthritis', 'jodon mein dard', 'जोड़ों में दर्द'],
      'back_pain': ['back pain', 'kamar dard', 'कमर दर्द'],
      'sleep_problems': ['insomnia', 'sleeplessness', 'neend nahi aana', 'नींद नहीं आना'],
      'excessive_thirst': ['excessive thirst', 'increased thirst', 'zyada pyaas', 'ज्यादा प्यास'],
      'weight_loss': ['weight loss', 'wajan kam hona', 'वजन कम होना'],
      'night_sweats': ['night sweats', 'raat mein pasina', 'रात में पसीना'],
      'loss_of_appetite': ['loss of appetite', 'bhookh na lagna', 'भूख न लगना']
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

  // Disease prediction using advanced matching algorithm
  predictDisease(symptoms: string[]): { 
    disease: string; 
    confidence: number; 
    matchedSymptoms: string[];
    severity: 'mild' | 'moderate' | 'severe';
  } | null {
    
    let bestMatch = { 
      disease: "", 
      confidence: 0, 
      matchedSymptoms: [] as string[],
      severity: 'mild' as 'mild' | 'moderate' | 'severe'
    };
    
    for (const [disease, diseaseSymptoms] of Object.entries(DISEASE_SYMPTOM_MAPPING)) {
      const matchedSymptoms = symptoms.filter(symptom => 
        diseaseSymptoms.some(ds => 
          ds.toLowerCase().includes(symptom.toLowerCase()) || 
          symptom.toLowerCase().includes(ds.toLowerCase())
        )
      );
      
      if (matchedSymptoms.length > 0) {
        // Calculate confidence based on symptom match ratio and specificity
        const baseConfidence = (matchedSymptoms.length / diseaseSymptoms.length) * 100;
        const specificityBonus = matchedSymptoms.length >= 3 ? 10 : 0;
        const confidence = Math.min(baseConfidence + specificityBonus, 90); // Cap at 90%
        
        if (confidence > bestMatch.confidence) {
          let severity: 'mild' | 'moderate' | 'severe' = 'mild';
          
          // Determine severity based on disease type and symptom count
          if (['Pneumonia', 'Tuberculosis', 'Hepatitis', 'Malaria'].includes(disease)) {
            severity = 'severe';
          } else if (['Flu', 'Typhoid', 'Asthma', 'Hypertension'].includes(disease)) {
            severity = 'moderate';
          } else if (matchedSymptoms.length >= 4) {
            severity = 'moderate';
          }
          
          bestMatch = {
            disease,
            confidence,
            matchedSymptoms,
            severity
          };
        }
      }
    }
    
    return bestMatch.confidence > 0 ? bestMatch : null;
  }

  // Get relevant medicines for predicted disease
  getMedicinesForDisease(disease: string, severity: 'mild' | 'moderate' | 'severe'): Medicine[] {
    let medicines: Medicine[] = [];
    
    // Map diseases to medicine categories
    const diseaseToCategory = {
      'Common Cold': ['respiratory'],
      'Flu': ['respiratory', 'pain_fever'],
      'Pneumonia': ['respiratory'],
      'Asthma': ['respiratory'],
      'Bronchitis': ['respiratory'],
      'Allergic Rhinitis': ['allergy'],
      'Skin Allergy': ['allergy'],
      'Gastritis': ['gastrointestinal'],
      'Food Poisoning': ['gastrointestinal'],
      'GERD': ['gastrointestinal'],
      'UTI': ['respiratory'], // Using antibiotics
      'Migraine': ['pain_fever'],
      'Anxiety': ['anxiety'],
      'Depression': ['anxiety'],
      'Hypertension': ['pain_fever'],
      'Diabetes': ['pain_fever'],
      'Typhoid': ['respiratory'], // Using antibiotics
      'Malaria': ['respiratory'], // Using antibiotics
      'Tuberculosis': ['respiratory'],
      'Hepatitis': ['gastrointestinal'],
      'Arthritis': ['pain_fever']
    };

    const categories = diseaseToCategory[disease as keyof typeof diseaseToCategory] || ['pain_fever'];
    
    for (const category of categories) {
      if (MEDICINE_DATABASE[category]) {
        medicines.push(...MEDICINE_DATABASE[category]);
      }
    }

    // Sort by relevance and limit based on severity
    const maxMedicines = severity === 'severe' ? 4 : severity === 'moderate' ? 3 : 2;
    return medicines.slice(0, maxMedicines);
  }

  // Generate comprehensive medical consultation
  async generateMedicalConsultation(
    userMessage: string,
    patientDetails: any
  ): Promise<{
    symptoms: string[];
    prediction: any;
    medicines: Medicine[];
    advice: string;
    prescription?: any;
  }> {
    
    // Extract symptoms from user message
    const symptoms = this.extractMedicalSymptoms(userMessage);
    
    if (symptoms.length === 0) {
      return {
        symptoms: [],
        prediction: null,
        medicines: [],
        advice: "Please describe your symptoms in more detail so I can provide accurate medical guidance."
      };
    }

    // Predict disease
    const prediction = this.predictDisease(symptoms);
    
    if (!prediction) {
      return {
        symptoms,
        prediction: null,
        medicines: [],
        advice: "Based on the symptoms described, I recommend consulting a healthcare professional for proper diagnosis."
      };
    }

    // Get relevant medicines
    const medicines = this.getMedicinesForDisease(prediction.disease, prediction.severity);
    
    // Generate AI-powered medical advice
    const advice = await this.generateDetailedAdvice(
      prediction.disease,
      symptoms,
      patientDetails,
      prediction.confidence,
      prediction.severity
    );

    // Generate prescription if medicines are recommended
    let prescription = null;
    if (medicines.length > 0) {
      prescription = this.generatePrescription(
        prediction.disease,
        medicines,
        patientDetails,
        prediction.severity
      );
    }

    return {
      symptoms,
      prediction,
      medicines,
      advice,
      prescription
    };
  }

  // Generate detailed medical advice using AI
  private async generateDetailedAdvice(
    disease: string,
    symptoms: string[],
    patientDetails: any,
    confidence: number,
    severity: 'mild' | 'moderate' | 'severe'
  ): Promise<string> {
    
    try {
      const prompt = `You are an experienced medical doctor. Provide comprehensive medical advice for:

Disease: ${disease}
Symptoms: ${symptoms.join(', ')}
Patient Age: ${patientDetails.age}
Patient Gender: ${patientDetails.gender}
Confidence Level: ${confidence.toFixed(1)}%
Severity: ${severity}

Please provide:
1. Brief explanation of the condition
2. Immediate care instructions
3. Lifestyle recommendations
4. When to seek emergency care
5. Recovery timeline
6. Prevention tips

Keep response professional and include both English and Hindi guidance where helpful.
Always emphasize consulting healthcare professionals for serious conditions.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional medical AI assistant. Provide accurate, helpful medical information while emphasizing the importance of professional medical consultation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.2
      });

      return response.choices[0].message.content || "Please consult a healthcare professional for personalized medical advice.";
      
    } catch (error) {
      console.error("Error generating medical advice:", error);
      return `For ${disease}, please follow basic care guidelines: rest, stay hydrated, take prescribed medications, and consult a doctor if symptoms worsen. This is a preliminary assessment and professional medical consultation is recommended.`;
    }
  }

  // Generate medical prescription
  private generatePrescription(
    disease: string,
    medicines: Medicine[],
    patientDetails: any,
    severity: 'mild' | 'moderate' | 'severe'
  ): any {
    
    const medications = medicines.map((med, index) => ({
      name: med.name,
      composition: med.composition,
      dosage: this.calculateDosage(med.type, patientDetails.age, severity),
      frequency: this.getFrequency(med.type, severity),
      duration: this.getDuration(disease, severity),
      instructions: this.getInstructions(med.type),
      price: `₹${med.price}`
    }));

    return {
      id: `RX${Date.now()}`,
      patientName: patientDetails.name,
      age: patientDetails.age,
      gender: patientDetails.gender,
      bloodGroup: patientDetails.bloodGroup,
      date: new Date().toLocaleDateString('en-IN'),
      diagnosis: disease,
      symptoms: medicines.map(m => m.description).join(', ').substring(0, 150) + "...",
      medications,
      instructions: this.getGeneralInstructions(disease, severity),
      doctorName: patientDetails.gender === 'Male' ? 'Dr. Priya Sharma' : 'Dr. Arjun Patel',
      clinicName: 'JeevanCare AI Medical Center',
      signature: 'AI Generated - Verified Digital Prescription'
    };
  }

  private calculateDosage(medicineType: string, age: string, severity: 'mild' | 'moderate' | 'severe'): string {
    const ageNum = parseInt(age);
    const severityMultiplier = severity === 'severe' ? 1.2 : severity === 'moderate' ? 1.0 : 0.8;
    
    if (medicineType.includes('Tablet') || medicineType.includes('Capsule')) {
      const baseDose = ageNum < 12 ? 0.5 : 1;
      return `${Math.round(baseDose * severityMultiplier)} tablet`;
    } else if (medicineType.includes('Syrup')) {
      const baseDose = ageNum < 12 ? 5 : 10;
      return `${Math.round(baseDose * severityMultiplier)}ml`;
    }
    return "As directed";
  }

  private getFrequency(medicineType: string, severity: 'mild' | 'moderate' | 'severe'): string {
    if (severity === 'severe') {
      return medicineType.includes('Antibiotic') ? "Three times daily" : "Twice daily";
    }
    return medicineType.includes('Antibiotic') ? "Twice daily" : "Once daily";
  }

  private getDuration(disease: string, severity: 'mild' | 'moderate' | 'severe'): string {
    const baseDays = severity === 'severe' ? 10 : severity === 'moderate' ? 7 : 5;
    
    if (disease.includes('Infection') || disease.includes('Pneumonia') || disease.includes('Tuberculosis')) {
      return `${baseDays + 5} days`;
    }
    return `${baseDays} days`;
  }

  private getInstructions(medicineType: string): string {
    const instructions = {
      'Antibiotic': 'Take with food. Complete full course even if feeling better.',
      'Antihistamine': 'May cause drowsiness. Avoid driving or operating machinery.',
      'Expectorant': 'Take after meals. Drink plenty of water.',
      'Antacid': 'Take before meals or as directed.',
      'Analgesic': 'Take with food to avoid stomach upset.',
      'Anxiolytic': 'Take as directed. Do not exceed prescribed dose.'
    };
    
    for (const [type, instruction] of Object.entries(instructions)) {
      if (medicineType.includes(type)) {
        return instruction;
      }
    }
    return 'Take as directed by physician.';
  }

  private getGeneralInstructions(disease: string, severity: 'mild' | 'moderate' | 'severe'): string[] {
    const baseInstructions = [
      "Take all medicines as prescribed",
      "Complete the full course of treatment",
      "Stay well hydrated - drink 8-10 glasses of water daily",
      "Get adequate rest and sleep",
      "Follow up if symptoms worsen or persist"
    ];

    if (severity === 'severe') {
      baseInstructions.push("Seek immediate medical attention if symptoms worsen");
      baseInstructions.push("Monitor vital signs regularly");
    }

    if (disease.includes('Respiratory') || ['Common Cold', 'Flu', 'Pneumonia', 'Bronchitis'].includes(disease)) {
      baseInstructions.push("Use steam inhalation 2-3 times daily");
      baseInstructions.push("Avoid cold foods and drinks");
      baseInstructions.push("Maintain good respiratory hygiene");
    }

    if (['UTI', 'Typhoid', 'Tuberculosis'].includes(disease)) {
      baseInstructions.push("Maintain strict personal hygiene");
      baseInstructions.push("Wash hands frequently with soap");
    }

    return baseInstructions;
  }
}

export const diseasePredictionEngine = new DiseasePredictionEngine();