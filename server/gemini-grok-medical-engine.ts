import OpenAI from "openai";
import { readFileSync } from 'fs';
import { join } from 'path';

// Language detection patterns
const LANGUAGE_PATTERNS = {
  hindi: /[\u0900-\u097F]|(?:mai|mujhe|mera|tera|kya|hai|ho|raha|kar|le|ja|na|se|me|ki|ka|ko|pe|par|aur|ya|nahi|haan|ji|bhi|kuch|koi|sab|yeh|woh|kaise|kahan|kab|kyun|kyu|kitna|jyada|kam|accha|bura|theek|sahi|galat|paani|khana|dawa|dawai|bimari|bukhar|sir|pet|dard|doctor|hospital)/i,
  bengali: /[\u0980-\u09FF]|(?:ami|tumi|se|ei|oi|ki|kemon|kore|korbo|ache|hobe|debo|nebo|jabo|asbo|khabo|korte|pari|parbo|bhalo|kharap|thik|jol|khabar|osudh|rog|jor|matha|pet|byatha)/i,
  tamil: /[\u0B80-\u0BFF]|(?:nan|nee|avan|aval|enna|epdi|eppadi|irukku|varum|poren|varen|vandhen|sapadu|marundhu|noi|kaichal|thalai|vayiru|vali)/i,
  telugu: /[\u0C00-\u0C7F]|(?:nenu|meeru|ayana|aame|enti|ela|undi|vastundi|veltanu|vastanu|vacchanu|aaharam|mandu|vyadhi|jwaram|tala|kడుపు|noppi)/i,
  marathi: /[\u0900-\u097F]|(?:mi|tu|to|ti|kay|kase|ahe|hoil|jato|yeto|alo|jevan|aushadh|aajar|taap|donke|pोट|vedana)/i,
  gujarati: /[\u0A80-\u0AFF]|(?:hun|tame|te|teni|shu|kem|che|hashe|jais|avis|aavyo|jaman|dava|rog|તાવ|માથું|પેट|દુખાવો)/i,
  punjabi: /[\u0A00-\u0A7F]|(?:main|tusi|oh|ki|kiven|hai|huga|janga|aunga|aaya|khana|dawa|bimari|bukhar|sir|pet|dard)/i,
  urdu: /[\u0600-\u06FF]|(?:main|aap|woh|kya|kaise|hai|hoga|jaunga|aunga|aaya|khana|dawa|bimari|bukhar|sar|pet|dard)/i,
  english: /^[a-zA-Z\s\d.,!?;:'"()-]+$/
};

// Medicine database interface
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
  category: string;
  dosageForm: string;
  strength: string;
  packageSize: string;
  prescriptionRequired: boolean;
}

export class GeminiGrokMedicalEngine {
  private openai: OpenAI;
  private grokClient: OpenAI;
  private medicineDatabase: Medicine[] = [];

  constructor() {
    // Initialize Gemini API client
    this.openai = new OpenAI({
      baseURL: "https://generativelanguage.googleapis.com/v1beta",
      apiKey: process.env.GEMINI_API_KEY || '',
    });

    // Initialize Grok API client
    this.grokClient = new OpenAI({
      baseURL: "https://api.x.ai/v1",
      apiKey: process.env.XAI_API_KEY || '',
    });

    // Load medicine database
    this.loadMedicineDatabase();
  }

  private loadMedicineDatabase() {
    try {
      const dbPath = join(process.cwd(), 'attached_assets', 'updated_indian_medicine_data.csv');
      const csvData = readFileSync(dbPath, 'utf-8');
      
      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= headers.length && values[0]) {
          const medicine: Medicine = {
            id: values[0] || `med_${i}`,
            name: values[1] || 'Unknown Medicine',
            price: parseFloat(values[2]) || 0,
            manufacturer: values[3] || 'Unknown',
            type: values[4] || 'General',
            composition: values[5] || 'Not specified',
            description: values[6] || 'No description available',
            sideEffects: values[7] || 'Consult doctor',
            drugInteractions: values[8] || 'Consult doctor',
            category: values[9] || 'General',
            dosageForm: values[10] || 'Tablet',
            strength: values[11] || 'As prescribed',
            packageSize: values[12] || '1 unit',
            prescriptionRequired: values[13]?.toLowerCase() === 'yes' || true
          };
          this.medicineDatabase.push(medicine);
        }
      }
      
      console.log(`Loaded ${this.medicineDatabase.length} medicines from database`);
    } catch (error) {
      console.error('Failed to load medicine database:', error);
      // Fallback to basic medicine data
      this.medicineDatabase = this.getBasicMedicineData();
    }
  }

  private getBasicMedicineData(): Medicine[] {
    return [
      {
        id: "med_001",
        name: "Paracetamol 500mg",
        price: 15.50,
        manufacturer: "Cipla Ltd",
        type: "Analgesic",
        composition: "Paracetamol 500mg",
        description: "Pain reliever and fever reducer",
        sideEffects: "Nausea, skin rash (rare)",
        drugInteractions: "Warfarin, alcohol",
        category: "Pain Management",
        dosageForm: "Tablet",
        strength: "500mg",
        packageSize: "10 tablets",
        prescriptionRequired: false
      },
      {
        id: "med_002",
        name: "Amoxicillin 250mg",
        price: 45.75,
        manufacturer: "Sun Pharma",
        type: "Antibiotic",
        composition: "Amoxicillin 250mg",
        description: "Broad-spectrum antibiotic for bacterial infections",
        sideEffects: "Diarrhea, nausea, skin rash",
        drugInteractions: "Methotrexate, oral contraceptives",
        category: "Antibiotics",
        dosageForm: "Capsule",
        strength: "250mg",
        packageSize: "10 capsules",
        prescriptionRequired: true
      }
    ];
  }

  detectLanguage(text: string): string {
    const normalizedText = text.toLowerCase();
    
    for (const [language, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
      if (pattern.test(normalizedText)) {
        return language;
      }
    }
    
    return 'english'; // Default to English if no pattern matches
  }

  async analyzeWithGemini(symptoms: string, language: string, patientDetails: any): Promise<any> {
    try {
      const prompt = this.buildGeminiPrompt(symptoms, language, patientDetails);
      
      // Use Gemini Pro API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt + "\n\nPlease respond with valid JSON only."
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1500,
          }
        })
      });

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      // Extract JSON from response
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      
      return result;
    } catch (error) {
      console.error('Gemini analysis failed:', error);
      // Fallback to basic analysis
      return {
        primaryDiagnosis: "General medical condition",
        confidence: 70,
        symptoms: this.extractSymptoms(symptoms),
        severity: "mild",
        response: language === 'hindi' 
          ? "आपके लक्षणों के आधार पर उपचार की सलाह दी गई है।"
          : "Treatment advice provided based on your symptoms."
      };
    }
  }

  async analyzeWithGrok(symptoms: string, language: string, patientDetails: any): Promise<any> {
    try {
      const prompt = this.buildGrokPrompt(symptoms, language, patientDetails);
      
      const response = await this.grokClient.chat.completions.create({
        model: "grok-2-1212",
        messages: [
          {
            role: "system",
            content: "You are Grok, an advanced medical AI with expertise in Indian healthcare, traditional medicine, and modern pharmaceuticals. Provide comprehensive medical analysis with cultural sensitivity."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 1500
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result;
    } catch (error) {
      console.error('Grok analysis failed:', error);
      throw error;
    }
  }

  private buildGeminiPrompt(symptoms: string, language: string, patientDetails: any): string {
    return `
Analyze the following medical case in ${language} language:

Patient Details:
- Age: ${patientDetails.age}
- Gender: ${patientDetails.gender}
- Blood Group: ${patientDetails.bloodGroup}

Symptoms: ${symptoms}

Please provide a comprehensive medical analysis in JSON format with the following structure:
{
  "detectedLanguage": "${language}",
  "primaryDiagnosis": "Most likely condition",
  "confidence": 85,
  "symptoms": ["symptom1", "symptom2"],
  "severity": "mild|moderate|severe",
  "recommendedTests": ["test1", "test2"],
  "urgency": "low|medium|high",
  "specialistReferral": "specialist type if needed",
  "response": "Detailed explanation in ${language}",
  "medicalAdvice": {
    "do": ["advice1", "advice2"],
    "dont": ["avoid1", "avoid2"],
    "lifestyle": ["change1", "change2"]
  },
  "followUp": "Follow-up instructions"
}

Focus on conditions common in India and consider cultural factors in your response.
`;
  }

  private buildGrokPrompt(symptoms: string, language: string, patientDetails: any): string {
    return `
Hey Grok! I need your medical expertise for this case in ${language}:

Patient: ${patientDetails.age}yr old ${patientDetails.gender}, Blood Group: ${patientDetails.bloodGroup}
Symptoms: ${symptoms}

Give me a detailed medical analysis in JSON format:
{
  "diagnosis": "Primary diagnosis",
  "confidence": 90,
  "reasoning": "Why this diagnosis",
  "severity": "mild|moderate|severe",
  "emergencyAlert": false,
  "treatmentPlan": "Treatment approach",
  "response": "Patient-friendly explanation in ${language}",
  "redFlags": ["warning signs to watch"],
  "homeRemedies": ["safe home treatments"],
  "whenToSeeDoctor": "Clear criteria for medical consultation"
}

Be direct, practical, and consider Indian healthcare context.
`;
  }

  searchMedicines(condition: string, symptoms: string[]): Medicine[] {
    const searchTerms = [condition, ...symptoms].map(term => term.toLowerCase());
    
    const relevantMedicines = this.medicineDatabase.filter(med => {
      const searchText = `${med.name} ${med.type} ${med.category} ${med.description} ${med.composition}`.toLowerCase();
      
      return searchTerms.some(term => 
        searchText.includes(term) || 
        this.isRelatedCondition(term, med.category.toLowerCase()) ||
        this.isRelatedMedicine(term, med.type.toLowerCase())
      );
    });

    // Sort by relevance and price
    return relevantMedicines
      .sort((a, b) => {
        // Priority: Essential medicines first, then by price
        const aEssential = this.isEssentialMedicine(a.type);
        const bEssential = this.isEssentialMedicine(b.type);
        
        if (aEssential && !bEssential) return -1;
        if (!aEssential && bEssential) return 1;
        
        return a.price - b.price;
      })
      .slice(0, 5); // Return top 5 relevant medicines
  }

  private isRelatedCondition(symptom: string, category: string): boolean {
    const conditionMap: { [key: string]: string[] } = {
      'fever': ['analgesic', 'antipyretic', 'pain'],
      'headache': ['analgesic', 'pain', 'neurological'],
      'cough': ['respiratory', 'expectorant', 'antitussive'],
      'cold': ['respiratory', 'decongestant', 'antihistamine'],
      'pain': ['analgesic', 'anti-inflammatory', 'pain'],
      'infection': ['antibiotic', 'antimicrobial', 'antiseptic'],
      'stomach': ['antacid', 'digestive', 'gastric'],
      'acidity': ['antacid', 'gastric', 'digestive'],
      'diarrhea': ['antidiarrheal', 'digestive', 'gastric']
    };

    return conditionMap[symptom]?.some(cat => category.includes(cat)) || false;
  }

  private isRelatedMedicine(symptom: string, type: string): boolean {
    const medicineMap: { [key: string]: string[] } = {
      'fever': ['analgesic', 'antipyretic', 'paracetamol'],
      'pain': ['analgesic', 'ibuprofen', 'diclofenac'],
      'infection': ['antibiotic', 'amoxicillin', 'azithromycin'],
      'cough': ['expectorant', 'antitussive', 'bromhexine'],
      'allergy': ['antihistamine', 'cetirizine', 'loratadine']
    };

    return medicineMap[symptom]?.some(med => type.includes(med)) || false;
  }

  private isEssentialMedicine(type: string): boolean {
    const essentialTypes = ['analgesic', 'antibiotic', 'antipyretic', 'antacid', 'antihistamine'];
    return essentialTypes.some(essential => type.toLowerCase().includes(essential));
  }

  async generateComprehensiveResponse(
    symptoms: string, 
    patientDetails: any
  ): Promise<{
    detectedLanguage: string;
    geminiAnalysis: any;
    grokAnalysis: any;
    medicines: Medicine[];
    finalResponse: string;
    confidence: number;
    severity: string;
  }> {
    // Detect language automatically
    const detectedLanguage = this.detectLanguage(symptoms);
    
    try {
      // Run both AI analyses in parallel
      const [geminiResult, grokResult] = await Promise.allSettled([
        this.analyzeWithGemini(symptoms, detectedLanguage, patientDetails),
        this.analyzeWithGrok(symptoms, detectedLanguage, patientDetails)
      ]);

      const geminiAnalysis = geminiResult.status === 'fulfilled' ? geminiResult.value : null;
      const grokAnalysis = grokResult.status === 'fulfilled' ? grokResult.value : null;

      // Extract diagnosis for medicine search
      const primaryDiagnosis = geminiAnalysis?.primaryDiagnosis || grokAnalysis?.diagnosis || 'general symptoms';
      const extractedSymptoms = geminiAnalysis?.symptoms || this.extractSymptoms(symptoms);

      // Search for relevant medicines
      const medicines = this.searchMedicines(primaryDiagnosis, extractedSymptoms);

      // Generate final response combining both analyses
      const finalResponse = this.combineAnalyses(geminiAnalysis, grokAnalysis, medicines, detectedLanguage);
      
      const confidence = Math.max(
        geminiAnalysis?.confidence || 0,
        grokAnalysis?.confidence || 0
      );

      const severity = geminiAnalysis?.severity || grokAnalysis?.severity || 'mild';

      return {
        detectedLanguage,
        geminiAnalysis,
        grokAnalysis,
        medicines,
        finalResponse,
        confidence,
        severity
      };

    } catch (error) {
      console.error('Comprehensive analysis failed:', error);
      throw error;
    }
  }

  private extractSymptoms(text: string): string[] {
    const commonSymptoms = [
      'fever', 'headache', 'cough', 'cold', 'pain', 'nausea', 'vomiting', 
      'diarrhea', 'constipation', 'fatigue', 'weakness', 'dizziness',
      'bukhar', 'sir dard', 'khansi', 'jukam', 'dard', 'ulti', 'kamzori'
    ];
    
    return commonSymptoms.filter(symptom => 
      text.toLowerCase().includes(symptom.toLowerCase())
    );
  }

  private combineAnalyses(gemini: any, grok: any, medicines: Medicine[], language: string): string {
    const diagnosis = gemini?.primaryDiagnosis || grok?.diagnosis || 'Unknown condition';
    const severity = gemini?.severity || grok?.severity || 'mild';
    
    let response = '';

    if (language === 'hindi') {
      response = `आपके लक्षणों के आधार पर, आपको ${diagnosis} हो सकता है। यह ${severity === 'mild' ? 'हल्की' : severity === 'moderate' ? 'मध्यम' : 'गंभीर'} स्थिति है।\n\n`;
      
      if (medicines.length > 0) {
        response += `सुझाई गई दवाएं:\n`;
        medicines.forEach((med, index) => {
          response += `${index + 1}. ${med.name} - ₹${med.price}\n   ${med.description}\n`;
        });
      }
    } else {
      response = `Based on your symptoms, you may have ${diagnosis}. This appears to be a ${severity} condition.\n\n`;
      
      if (medicines.length > 0) {
        response += `Recommended medicines:\n`;
        medicines.forEach((med, index) => {
          response += `${index + 1}. ${med.name} - ₹${med.price}\n   ${med.description}\n`;
        });
      }
    }

    // Add medical advice
    const advice = gemini?.medicalAdvice || grok?.homeRemedies;
    if (advice) {
      response += language === 'hindi' ? '\n\nचिकित्सा सलाह:\n' : '\n\nMedical Advice:\n';
      if (Array.isArray(advice)) {
        advice.forEach(item => response += `• ${item}\n`);
      } else if (typeof advice === 'object') {
        if (advice.do) advice.do.forEach((item: string) => response += `• ${item}\n`);
      }
    }

    return response;
  }
}

export const geminiGrokMedicalEngine = new GeminiGrokMedicalEngine();