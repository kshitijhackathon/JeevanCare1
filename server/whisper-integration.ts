// Advanced Medical AI with Bio_ClinicalBERT-style symptom detection
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export class AdvancedMedicalAI {
  // Bio_ClinicalBERT-style medical entity extraction
  private medicalEntities = {
    symptoms: {
      // Cardiovascular
      'chest pain': ['chest pain', 'seene mein dard', 'chati mein pain', 'heart pain'],
      'shortness of breath': ['saans phoolna', 'breathing problem', 'saans lene mein dikkat'],
      'palpitations': ['dil ki dhadak', 'heart racing', 'rapid heartbeat'],
      
      // Respiratory
      'cough': ['khansi', 'cough', 'khasi', 'throat irritation'],
      'sore throat': ['gale mein kharab', 'throat pain', 'gala dukh raha'],
      'wheezing': ['saans mein awaz', 'whistling sound'],
      
      // Gastrointestinal
      'stomach pain': ['pet mein dard', 'stomach ache', 'pait dard'],
      'nausea': ['jee machalna', 'ulti aana', 'nausea'],
      'vomiting': ['ulti', 'vomiting', 'throwing up'],
      'diarrhea': ['loose motion', 'diarrhea', 'pancheri'],
      
      // Neurological
      'headache': ['sir dard', 'headache', 'sar mein dard'],
      'dizziness': ['chakkar aana', 'dizziness', 'balance problem'],
      'confusion': ['confusion', 'dimag mein dhundlapan'],
      
      // Musculoskeletal
      'back pain': ['kamar dard', 'back pain', 'peeth mein dard'],
      'joint pain': ['jodo mein dard', 'arthritis pain', 'joint ache'],
      'muscle pain': ['muscle pain', 'body ache', 'sharir mein dard'],
      
      // General
      'fever': ['bukhar', 'fever', 'high temperature', 'tez bukhar'],
      'fatigue': ['thakan', 'weakness', 'kamzori'],
      'sweating': ['paseena', 'sweating', 'night sweats']
    },
    
    medications: {
      // Pain & Fever
      'paracetamol': { hindi: 'Paracetamol', dosage: '500-1000mg every 6 hours', max: '4g/day' },
      'ibuprofen': { hindi: 'Ibuprofen', dosage: '400-600mg every 8 hours', max: '2.4g/day' },
      'aspirin': { hindi: 'Aspirin', dosage: '325-650mg every 4 hours', max: '4g/day' },
      
      // Cardiovascular
      'amlodipine': { hindi: 'Amlodipine', dosage: '2.5-10mg once daily', indication: 'Hypertension' },
      'metoprolol': { hindi: 'Metoprolol', dosage: '25-100mg twice daily', indication: 'Heart conditions' },
      
      // Gastrointestinal
      'omeprazole': { hindi: 'Omeprazole', dosage: '20-40mg once daily', indication: 'Acidity' },
      'domperidone': { hindi: 'Domperidone', dosage: '10mg three times daily', indication: 'Nausea' },
      'ors': { hindi: 'ORS Solution', dosage: '1 packet in 200ml water', indication: 'Dehydration' },
      
      // Respiratory
      'azithromycin': { hindi: 'Azithromycin', dosage: '500mg once daily for 3 days', indication: 'Bacterial infection' },
      'salbutamol': { hindi: 'Salbutamol inhaler', dosage: '2 puffs every 6 hours', indication: 'Asthma' },
      
      // Diabetes
      'metformin': { hindi: 'Metformin', dosage: '500mg twice daily', indication: 'Diabetes' },
      'glimepiride': { hindi: 'Glimepiride', dosage: '1-2mg once daily', indication: 'Type 2 Diabetes' }
    }
  };

  // Enhanced symptom detection algorithm
  extractSymptoms(text: string): string[] {
    const normalizedText = text.toLowerCase();
    const detectedSymptoms: string[] = [];
    
    for (const [symptom, variations] of Object.entries(this.medicalEntities.symptoms)) {
      for (const variation of variations) {
        if (normalizedText.includes(variation.toLowerCase())) {
          detectedSymptoms.push(symptom);
          break;
        }
      }
    }
    
    return [...new Set(detectedSymptoms)]; // Remove duplicates
  }

  // Generate comprehensive medical response
  generateMedicalResponse(symptoms: string[], patientDetails: any): { hindi: string, english: string, prescription: any } {
    if (symptoms.length === 0) {
      return {
        hindi: `Namaste ${patientDetails.name}! Main aapka AI doctor hun. Kripya detail mein batayiye:\n\n• **Symptoms** - Kya problem ho rahi hai?\n• **Duration** - Kitne din se?\n• **Severity** - Kitna tez hai (1-10)?\n• **Associated symptoms** - Aur koi problem?\n\nMain accurate diagnosis aur treatment provide karunga.`,
        english: `Hello ${patientDetails.name}! I'm your AI doctor. Please describe in detail:\n\n• **Symptoms** - What problems are you experiencing?\n• **Duration** - How long have you had these?\n• **Severity** - How severe (1-10 scale)?\n• **Associated symptoms** - Any other issues?\n\nI'll provide accurate diagnosis and treatment.`,
        prescription: null
      };
    }

    let hindiResponse = `**${patientDetails.name}** ji, main aapke symptoms analyze kar chuka hun:\n\n`;
    let englishResponse = `**${patientDetails.name}**, I've analyzed your symptoms:\n\n`;
    let prescriptionMeds: any[] = [];

    // Process each symptom
    symptoms.forEach(symptom => {
      const treatment = this.getSymptomTreatment(symptom, patientDetails);
      hindiResponse += `🔸 **${symptom}**: ${treatment.hindi}\n`;
      englishResponse += `🔸 **${symptom}**: ${treatment.english}\n`;
      prescriptionMeds.push(...treatment.medications);
    });

    // Add emergency warnings if needed
    const emergencySymptoms = ['chest pain', 'shortness of breath', 'severe headache'];
    const hasEmergency = symptoms.some(s => emergencySymptoms.includes(s));
    
    if (hasEmergency) {
      hindiResponse += `\n⚠️ **EMERGENCY**: Ye symptoms serious hain! Turant hospital jayiye ya 108 call kariye.\n`;
      englishResponse += `\n⚠️ **EMERGENCY**: These symptoms are serious! Visit hospital immediately or call emergency services.\n`;
    }

    // Generate prescription
    const prescription = this.generatePrescription(prescriptionMeds, patientDetails);

    return { hindi: hindiResponse, english: englishResponse, prescription };
  }

  private getSymptomTreatment(symptom: string, patientDetails: any): { hindi: string, english: string, medications: any[] } {
    const age = parseInt(patientDetails.age);
    const treatments: any = {
      'fever': {
        hindi: `Bukhar ke liye Paracetamol 500mg har 6 ghante lijiye. Paani zyada piye aur rest kariye.`,
        english: `For fever, take Paracetamol 500mg every 6 hours. Drink plenty of water and rest.`,
        medications: [{ name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6 hours', duration: '3-5 days' }]
      },
      'headache': {
        hindi: `Sir dard ke liye Ibuprofen 400mg le sakte hain. Dark room mein rest kariye.`,
        english: `For headache, you can take Ibuprofen 400mg. Rest in a dark room.`,
        medications: [{ name: 'Ibuprofen', dosage: '400mg', frequency: 'Every 8 hours', duration: 'As needed' }]
      },
      'stomach pain': {
        hindi: `Pet dard ke liye Omeprazole 20mg empty stomach par lijiye. Spicy food avoid kariye.`,
        english: `For stomach pain, take Omeprazole 20mg on empty stomach. Avoid spicy foods.`,
        medications: [{ name: 'Omeprazole', dosage: '20mg', frequency: 'Once daily', duration: '7 days' }]
      },
      'chest pain': {
        hindi: `Seene mein dard serious ho sakta hai. Aspirin 325mg chaba kar lijiye aur TURANT hospital jayiye!`,
        english: `Chest pain can be serious. Chew Aspirin 325mg and GO TO HOSPITAL IMMEDIATELY!`,
        medications: [{ name: 'Aspirin', dosage: '325mg', frequency: 'Once (emergency)', duration: 'Immediate' }]
      },
      'cough': {
        hindi: `Khansi ke liye honey-ginger tea piye. Azithromycin 500mg agar bacterial infection hai.`,
        english: `For cough, drink honey-ginger tea. Azithromycin 500mg if bacterial infection.`,
        medications: [{ name: 'Azithromycin', dosage: '500mg', frequency: 'Once daily', duration: '3 days' }]
      }
    };

    return treatments[symptom] || {
      hindi: `Is symptom ke liye doctor se consult kariye aur proper diagnosis karwayiye.`,
      english: `For this symptom, please consult a doctor for proper diagnosis.`,
      medications: []
    };
  }

  generatePrescription(medications: any[], patientDetails: any): any {
    return {
      patientName: patientDetails.name,
      age: patientDetails.age,
      gender: patientDetails.gender,
      bloodGroup: patientDetails.bloodGroup,
      date: new Date().toISOString().split('T')[0],
      medications: medications,
      instructions: [
        'Take medications as prescribed',
        'Complete the full course',
        'Consult doctor if symptoms worsen',
        'Return for follow-up as advised'
      ],
      doctorSignature: 'AI Medical Assistant - Jeevancare',
      clinicName: 'Jeevancare Digital Health Platform'
    };
  }

  // Simulated Whisper transcription (enhanced web speech recognition)
  async transcribeAudio(audioBlob: Blob, language: string = 'hi-IN'): Promise<string> {
    // This would integrate with actual Whisper when available
    return new Promise((resolve) => {
      // Enhanced speech recognition simulation
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = language === 'hindi' ? 'hi-IN' : 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        resolve(transcript);
      };
      
      recognition.start();
    });
  }
}

export const medicalAI = new AdvancedMedicalAI();