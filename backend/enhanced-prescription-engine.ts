import { geminiGrokMedicalEngine } from './gemini-grok-medical-engine';

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

interface PrescriptionItem {
  medicine: Medicine;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  timing: string;
}

interface GeneralPrescription {
  complaint: string;
  medicines: PrescriptionItem[];
  generalInstructions: string[];
  dietRecommendations: string[];
  precautions: string[];
  followUp: string;
}

export class EnhancedPrescriptionEngine {
  
  // Generate prescriptions for common chief complaints using authentic medicine database
  generateGeneralComplaintPrescription(complaint: string, patientAge: string, patientGender: string): GeneralPrescription {
    const normalizedComplaint = complaint.toLowerCase().trim();
    
    // Get relevant medicines from authentic database
    const relevantMedicines = this.getMedicinesForComplaint(normalizedComplaint);
    
    // Create prescription items with proper dosages
    const prescriptionItems = this.createPrescriptionItems(relevantMedicines, normalizedComplaint, patientAge, patientGender);
    
    return {
      complaint: this.formatComplaint(normalizedComplaint),
      medicines: prescriptionItems,
      generalInstructions: this.getGeneralInstructions(normalizedComplaint),
      dietRecommendations: this.getDietRecommendations(normalizedComplaint),
      precautions: this.getPrecautions(normalizedComplaint),
      followUp: this.getFollowUpInstructions(normalizedComplaint)
    };
  }

  private getMedicinesForComplaint(complaint: string): Medicine[] {
    // Map chief complaints to medicine categories
    const complaintMedicineMap: { [key: string]: string[] } = {
      'fever': ['paracetamol', 'ibuprofen', 'aspirin', 'acetaminophen', 'dolo'],
      'headache': ['paracetamol', 'ibuprofen', 'aspirin', 'sumatriptan', 'dolo'],
      'cold': ['cetirizine', 'paracetamol', 'phenylephrine', 'ambroxol', 'loratadine'],
      'cough': ['ambroxol', 'dextromethorphan', 'guaifenesin', 'bromhexine', 'terbutaline'],
      'stomach pain': ['omeprazole', 'ranitidine', 'domperidone', 'pantoprazole', 'antacid'],
      'acidity': ['omeprazole', 'ranitidine', 'pantoprazole', 'esomeprazole', 'antacid'],
      'diarrhea': ['loperamide', 'racecadotril', 'zinc', 'ors', 'norfloxacin'],
      'constipation': ['lactulose', 'bisacodyl', 'docusate', 'polyethylene glycol', 'isabgol'],
      'back pain': ['diclofenac', 'ibuprofen', 'paracetamol', 'etoricoxib', 'thiocolchicoside'],
      'joint pain': ['diclofenac', 'ibuprofen', 'etoricoxib', 'glucosamine', 'nimesulide'],
      'weakness': ['multivitamin', 'iron', 'vitamin b12', 'folic acid', 'protein'],
      'diabetes': ['metformin', 'glimepiride', 'insulin', 'sitagliptin', 'empagliflozin'],
      'hypertension': ['amlodipine', 'atenolol', 'losartan', 'enalapril', 'telmisartan'],
      'anxiety': ['alprazolam', 'clonazepam', 'escitalopram', 'sertraline', 'lorazepam'],
      'insomnia': ['zolpidem', 'eszopiclone', 'melatonin', 'alprazolam', 'trazodone']
    };

    // Find matching complaint patterns
    const matchingMedicines: string[] = [];
    for (const [key, medicines] of Object.entries(complaintMedicineMap)) {
      if (complaint.includes(key) || key.includes(complaint)) {
        matchingMedicines.push(...medicines);
      }
    }

    // If no specific match, use fever/general medicines as default
    if (matchingMedicines.length === 0) {
      matchingMedicines.push(...complaintMedicineMap['fever']);
    }

    // Search authentic medicine database for these medicines
    return geminiGrokMedicalEngine.searchMedicines(complaint, matchingMedicines);
  }

  private createPrescriptionItems(medicines: Medicine[], complaint: string, age: string, gender: string): PrescriptionItem[] {
    const items: PrescriptionItem[] = [];
    const patientAge = parseInt(age) || 25;
    
    // Select top 3-5 most relevant medicines
    const selectedMedicines = medicines.slice(0, Math.min(5, medicines.length));
    
    for (const medicine of selectedMedicines) {
      const item: PrescriptionItem = {
        medicine,
        dosage: this.calculateDosage(medicine, patientAge, gender, complaint),
        frequency: this.getFrequency(medicine, complaint),
        duration: this.getDuration(medicine, complaint),
        instructions: this.getInstructions(medicine, complaint),
        timing: this.getTiming(medicine, complaint)
      };
      items.push(item);
    }
    
    return items;
  }

  private calculateDosage(medicine: Medicine, age: number, gender: string, complaint: string): string {
    const medicineType = medicine.type.toLowerCase();
    const strength = medicine.strength || '';
    
    // Age-based dosage adjustments
    let dosageMultiplier = 1.0;
    if (age < 12) dosageMultiplier = 0.5;
    else if (age < 18) dosageMultiplier = 0.75;
    else if (age > 65) dosageMultiplier = 0.8;
    
    // Standard dosages for common medicine types
    const dosageMap: { [key: string]: string } = {
      'paracetamol': `${Math.round(500 * dosageMultiplier)}mg`,
      'ibuprofen': `${Math.round(400 * dosageMultiplier)}mg`,
      'aspirin': `${Math.round(325 * dosageMultiplier)}mg`,
      'omeprazole': `${Math.round(20 * dosageMultiplier)}mg`,
      'cetirizine': `${Math.round(10 * dosageMultiplier)}mg`,
      'ambroxol': `${Math.round(30 * dosageMultiplier)}mg`,
      'diclofenac': `${Math.round(50 * dosageMultiplier)}mg`,
      'metformin': `${Math.round(500 * dosageMultiplier)}mg`
    };
    
    // Find matching dosage or use strength from medicine data
    for (const [key, value] of Object.entries(dosageMap)) {
      if (medicine.name.toLowerCase().includes(key)) {
        return value;
      }
    }
    
    // Use medicine strength if available
    if (strength) {
      return strength;
    }
    
    // Default based on medicine type
    if (medicineType.includes('tablet')) return '1 tablet';
    if (medicineType.includes('capsule')) return '1 capsule';
    if (medicineType.includes('syrup')) return '5ml';
    if (medicineType.includes('injection')) return '1 vial';
    
    return '1 unit';
  }

  private getFrequency(medicine: Medicine, complaint: string): string {
    const medicineType = medicine.type.toLowerCase();
    const medicineName = medicine.name.toLowerCase();
    
    // Frequency based on medicine type and complaint severity
    if (medicineName.includes('paracetamol') || medicineName.includes('ibuprofen')) {
      return complaint.includes('severe') ? 'Every 6 hours' : 'Every 8 hours';
    }
    
    if (medicineName.includes('antibiotic') || medicineType.includes('antibiotic')) {
      return 'Every 8 hours';
    }
    
    if (medicineName.includes('antacid') || medicineName.includes('omeprazole')) {
      return 'Before meals';
    }
    
    if (medicineName.includes('vitamin') || medicineName.includes('supplement')) {
      return 'Once daily';
    }
    
    if (medicineName.includes('cough') || medicineName.includes('cold')) {
      return 'Every 6-8 hours';
    }
    
    return 'Twice daily';
  }

  private getDuration(medicine: Medicine, complaint: string): string {
    const medicineName = medicine.name.toLowerCase();
    
    if (medicineName.includes('antibiotic')) return '5-7 days';
    if (medicineName.includes('paracetamol') || medicineName.includes('fever')) return '3-5 days';
    if (medicineName.includes('vitamin') || medicineName.includes('supplement')) return '30 days';
    if (medicineName.includes('chronic') || complaint.includes('diabetes') || complaint.includes('hypertension')) return 'As directed';
    if (medicineName.includes('antacid') || medicineName.includes('acidity')) return '2 weeks';
    
    return '5-7 days';
  }

  private getInstructions(medicine: Medicine, complaint: string): string {
    const medicineName = medicine.name.toLowerCase();
    
    if (medicineName.includes('paracetamol') || medicineName.includes('fever')) {
      return 'Take with water. Do not exceed 4 doses in 24 hours.';
    }
    
    if (medicineName.includes('omeprazole') || medicineName.includes('antacid')) {
      return 'Take 30 minutes before meals on empty stomach.';
    }
    
    if (medicineName.includes('antibiotic')) {
      return 'Complete the full course even if feeling better. Take with food to avoid stomach upset.';
    }
    
    if (medicineName.includes('vitamin') || medicineName.includes('iron')) {
      return 'Take with meals to improve absorption.';
    }
    
    if (medicineName.includes('cough') || medicineName.includes('cold')) {
      return 'Take with warm water. Avoid cold drinks.';
    }
    
    return 'Take as directed by physician.';
  }

  private getTiming(medicine: Medicine, complaint: string): string {
    const medicineName = medicine.name.toLowerCase();
    
    if (medicineName.includes('omeprazole') || medicineName.includes('antacid')) return 'Before meals';
    if (medicineName.includes('vitamin') || medicineName.includes('iron')) return 'With meals';
    if (medicineName.includes('sleep') || medicineName.includes('night')) return 'Before bedtime';
    if (medicineName.includes('morning')) return 'Morning';
    
    return 'After meals';
  }

  private formatComplaint(complaint: string): string {
    return complaint.charAt(0).toUpperCase() + complaint.slice(1);
  }

  private getGeneralInstructions(complaint: string): string[] {
    const instructions = [
      'Take medicines as prescribed and at regular intervals',
      'Complete the full course of medication',
      'Consult doctor if symptoms worsen or persist beyond expected duration'
    ];

    if (complaint.includes('fever')) {
      instructions.push('Stay hydrated and take adequate rest');
      instructions.push('Use cold compress for high fever');
    }

    if (complaint.includes('cold') || complaint.includes('cough')) {
      instructions.push('Drink warm liquids like herbal tea, warm water');
      instructions.push('Avoid cold drinks and ice cream');
      instructions.push('Use humidifier or steam inhalation');
    }

    if (complaint.includes('stomach') || complaint.includes('acidity')) {
      instructions.push('Eat small, frequent meals');
      instructions.push('Avoid spicy, oily, and acidic foods');
    }

    return instructions;
  }

  private getDietRecommendations(complaint: string): string[] {
    const recommendations = [
      'Maintain a balanced diet with adequate nutrients',
      'Drink plenty of water (8-10 glasses daily)'
    ];

    if (complaint.includes('fever')) {
      recommendations.push('Light, easily digestible foods like khichdi, soup');
      recommendations.push('Fresh fruit juices and coconut water');
    }

    if (complaint.includes('cold') || complaint.includes('cough')) {
      recommendations.push('Warm foods and drinks like ginger tea, turmeric milk');
      recommendations.push('Honey and ginger for throat soothing');
    }

    if (complaint.includes('stomach') || complaint.includes('acidity')) {
      recommendations.push('Avoid citrus fruits, spicy foods, and caffeine');
      recommendations.push('Include yogurt, bananas, and bland foods');
    }

    if (complaint.includes('weakness')) {
      recommendations.push('Protein-rich foods like dal, eggs, lean meat');
      recommendations.push('Iron-rich foods like green vegetables, dates');
    }

    return recommendations;
  }

  private getPrecautions(complaint: string): string[] {
    const precautions = [
      'Do not self-medicate or change dosages without consulting doctor',
      'Inform doctor about any allergies or other medications you are taking'
    ];

    if (complaint.includes('fever')) {
      precautions.push('Monitor temperature regularly');
      precautions.push('Seek immediate medical attention if fever exceeds 103°F');
    }

    if (complaint.includes('stomach') || complaint.includes('acidity')) {
      precautions.push('Avoid alcohol and smoking');
      precautions.push('Do not lie down immediately after eating');
    }

    if (complaint.includes('diabetes')) {
      precautions.push('Monitor blood sugar levels regularly');
      precautions.push('Maintain consistent meal timings');
    }

    return precautions;
  }

  private getFollowUpInstructions(complaint: string): string {
    if (complaint.includes('chronic') || complaint.includes('diabetes') || complaint.includes('hypertension')) {
      return 'Follow up after 2 weeks or as advised by physician';
    }

    if (complaint.includes('fever') || complaint.includes('cold')) {
      return 'Follow up if symptoms persist beyond 5-7 days';
    }

    if (complaint.includes('stomach') || complaint.includes('acidity')) {
      return 'Follow up after 1 week if symptoms do not improve';
    }

    return 'Follow up after 3-5 days if no improvement or if symptoms worsen';
  }
}

export const enhancedPrescriptionEngine = new EnhancedPrescriptionEngine();