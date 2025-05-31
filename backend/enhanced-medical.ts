// Enhanced Medical AI with comprehensive symptom detection
export function extractComprehensiveSymptoms(message: string): string[] {
  const symptoms = [];
  
  // Fever & Temperature
  if (message.includes('fever') || message.includes('bukhar') || message.includes('temperature') || 
      message.includes('hot') || message.includes('garam') || message.includes('chills')) {
    symptoms.push('fever');
  }
  
  // Respiratory & Throat
  if (message.includes('cough') || message.includes('khansi') || message.includes('throat') || 
      message.includes('cold') || message.includes('breathing') || message.includes('chest') ||
      message.includes('asthma') || message.includes('pneumonia')) {
    symptoms.push('respiratory issues');
  }
  
  // Digestive System
  if (message.includes('stomach') || message.includes('pet') || message.includes('nausea') || 
      message.includes('vomit') || message.includes('diarrhea') || message.includes('constipation') ||
      message.includes('acidity') || message.includes('gas') || message.includes('indigestion')) {
    symptoms.push('digestive problems');
  }
  
  // Pain Management
  if (message.includes('headache') || message.includes('sir dard') || message.includes('migraine') || 
      message.includes('body pain') || message.includes('joint pain') || message.includes('back pain') ||
      message.includes('muscle') || message.includes('arthritis')) {
    symptoms.push('pain issues');
  }
  
  // Mental Health
  if (message.includes('depression') || message.includes('anxiety') || message.includes('stress') || 
      message.includes('sleep') || message.includes('insomnia') || message.includes('tension') ||
      message.includes('panic') || message.includes('worry')) {
    symptoms.push('mental health');
  }
  
  // Skin Conditions
  if (message.includes('rash') || message.includes('itch') || message.includes('skin') || 
      message.includes('allergy') || message.includes('acne') || message.includes('eczema') ||
      message.includes('infection') || message.includes('fungal')) {
    symptoms.push('skin conditions');
  }
  
  // Metabolic & Chronic
  if (message.includes('diabetes') || message.includes('sugar') || message.includes('thyroid') || 
      message.includes('weight') || message.includes('cholesterol') || message.includes('bp') ||
      message.includes('blood pressure') || message.includes('hypertension')) {
    symptoms.push('metabolic disorders');
  }
  
  // Women's Health
  if (message.includes('periods') || message.includes('menstrual') || message.includes('pregnancy') || 
      message.includes('pcod') || message.includes('pcos') || message.includes('gynec') ||
      message.includes('breast') || message.includes('ovarian')) {
    symptoms.push('womens health');
  }
  
  return symptoms;
}

// Detailed medical advice for comprehensive treatment
export function generateDetailedMedicalAdvice(symptoms: string[], patientDetails: any): { hindi: string, english: string } {
  let hindiAdvice = '';
  let englishAdvice = '';
  
  symptoms.forEach(symptom => {
    switch (symptom) {
      case 'fever':
        hindiAdvice += `🌡️ **Bukhar ka ilaj:**\n• Paracetamol 500mg, 6 ghante mein\n• Crocin 650mg high fever ke liye\n• 3-4 liter paani daily\n• ORS, coconut water\n• Complete bed rest\n\n`;
        englishAdvice += `🌡️ **Fever Treatment:**\n• Paracetamol 500mg every 6 hours\n• Crocin 650mg for high fever\n• 3-4 liters water daily\n• ORS, coconut water\n• Complete bed rest\n\n`;
        break;
        
      case 'respiratory issues':
        hindiAdvice += `🫁 **Saans ki problem:**\n• Steam inhalation 3x daily\n• Honey + ginger tea\n• Ascoril/Benadryl cough syrup\n• Azithromycin 500mg (antibiotic)\n• Avoid cold items\n\n`;
        englishAdvice += `🫁 **Respiratory Treatment:**\n• Steam inhalation 3x daily\n• Honey + ginger tea\n• Ascoril/Benadryl cough syrup\n• Azithromycin 500mg (antibiotic)\n• Avoid cold items\n\n`;
        break;
        
      case 'digestive problems':
        hindiAdvice += `🤢 **Pet ki problem:**\n• ORS solution regularly\n• BRAT diet (Banana, Rice, Apple, Toast)\n• Omeprazole 20mg (acidity)\n• Domperidone (nausea)\n• Avoid spicy food\n\n`;
        englishAdvice += `🤢 **Digestive Treatment:**\n• ORS solution regularly\n• BRAT diet (Banana, Rice, Apple, Toast)\n• Omeprazole 20mg (acidity)\n• Domperidone (nausea)\n• Avoid spicy food\n\n`;
        break;
        
      case 'pain issues':
        hindiAdvice += `💊 **Dard ka ilaj:**\n• Ibuprofen 400mg (inflammation)\n• Diclofenac gel (topical)\n• Muscle relaxant: Thiocolchicoside\n• Hot/cold therapy\n• Physiotherapy exercises\n\n`;
        englishAdvice += `💊 **Pain Management:**\n• Ibuprofen 400mg (anti-inflammatory)\n• Diclofenac gel (topical)\n• Muscle relaxant: Thiocolchicoside\n• Hot/cold therapy\n• Physiotherapy exercises\n\n`;
        break;
        
      case 'mental health':
        hindiAdvice += `🧠 **Mental health:**\n• Escitalopram 10mg (depression)\n• Alprazolam 0.25mg (anxiety)\n• Daily meditation\n• Regular exercise\n• Proper sleep cycle\n\n`;
        englishAdvice += `🧠 **Mental Health:**\n• Escitalopram 10mg (depression)\n• Alprazolam 0.25mg (anxiety)\n• Daily meditation\n• Regular exercise\n• Proper sleep cycle\n\n`;
        break;
        
      case 'skin conditions':
        hindiAdvice += `🌿 **Skin problems:**\n• Calamine lotion (itching)\n• Cetirizine 10mg (allergy)\n• Antifungal cream (infections)\n• Avoid harsh soaps\n• Cotton clothes\n\n`;
        englishAdvice += `🌿 **Skin Treatment:**\n• Calamine lotion (itching)\n• Cetirizine 10mg (allergy)\n• Antifungal cream (infections)\n• Avoid harsh soaps\n• Cotton clothing\n\n`;
        break;
        
      case 'metabolic disorders':
        hindiAdvice += `💉 **Sugar/BP control:**\n• Metformin 500mg (diabetes)\n• Amlodipine 5mg (BP)\n• Sugar-free diet\n• Regular monitoring\n• Daily exercise 30 min\n\n`;
        englishAdvice += `💉 **Metabolic Treatment:**\n• Metformin 500mg (diabetes)\n• Amlodipine 5mg (BP)\n• Sugar-free diet\n• Regular monitoring\n• Daily exercise 30 min\n\n`;
        break;
        
      case 'womens health':
        hindiAdvice += `🌸 **Women's health:**\n• Iron tablets (periods)\n• Folic acid 5mg\n• Mefenamic acid (period pain)\n• Regular checkups\n• Healthy diet\n\n`;
        englishAdvice += `🌸 **Women's Health:**\n• Iron supplements (periods)\n• Folic acid 5mg\n• Mefenamic acid (period pain)\n• Regular checkups\n• Healthy diet\n\n`;
        break;
    }
  });
  
  return { hindi: hindiAdvice, english: englishAdvice };
}