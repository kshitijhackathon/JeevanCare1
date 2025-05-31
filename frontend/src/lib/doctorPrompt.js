/**
 * Doctor Prompt Template for Hinglish Healthcare Assistant
 * Prevents generic responses and ensures medical reasoning
 */

import { getSymptomsSummary, getMedicalContext, getConversationHistory } from './contextStore.js';

/**
 * Build comprehensive prompt for LLM with medical context
 * @param {Object} sessionCtx - Current session context
 * @param {Array} extractedEntities - Recently extracted entities
 * @param {string} userMessage - Latest user message
 * @returns {string} Complete prompt for LLM
 */
export function buildDoctorPrompt(sessionCtx, extractedEntities = [], userMessage = '') {
  const medicalContext = getMedicalContext();
  const symptomsSummary = getSymptomsSummary();
  const conversationHistory = getConversationHistory(6);
  
  return `${getSystemPrompt()}

${getContextSection(medicalContext, symptomsSummary)}

${getConversationSection(conversationHistory)}

${getEntitiesSection(extractedEntities)}

${getCurrentMessageSection(userMessage)}

${getMedicalReasoningScaffold()}

${getResponseRules()}`;
}

function getSystemPrompt() {
  return `आप एक professional AI doctor हैं जो Hinglish में बात करते हैं। आपको:

1. हर symptom को carefully सुनना है और उसे restate करना है
2. Medical reasoning के साथ respond करना है
3. Generic replies बिल्कुल नहीं देने हैं जैसे "Main aapki baat samajh gaya"
4. हर unclear symptom के लिए specific follow-up questions पूछने हैं
5. Possible diagnoses suggest करने हैं probability के साथ
6. Safe medications और tests recommend करने हैं जब appropriate हो

आपकी भाषा professional Hinglish होनी चाहिए - medical terms English में, conversation Hindi/Hinglish में।`;
}

function getContextSection(medicalContext, symptomsSummary) {
  return `
=== PATIENT CONTEXT ===
Patient Info: ${medicalContext.userInfo.name ? `${medicalContext.userInfo.name}, ` : ''}${medicalContext.userInfo.age ? `${medicalContext.userInfo.age} years old, ` : ''}${medicalContext.userInfo.gender || 'Gender not specified'}

Current Symptoms Summary: ${symptomsSummary}

Tests Already Ordered: ${medicalContext.testsOrdered.length > 0 ? medicalContext.testsOrdered.join(', ') : 'None'}

Medicines Already Given: ${medicalContext.medicinesGiven.length > 0 ? medicalContext.medicinesGiven.join(', ') : 'None'}

Session Duration: ${medicalContext.sessionDuration}`;
}

function getConversationSection(conversationHistory) {
  return `
=== CONVERSATION HISTORY ===
${conversationHistory || 'New conversation started'}`;
}

function getEntitiesSection(extractedEntities) {
  if (!extractedEntities || extractedEntities.length === 0) {
    return `
=== EXTRACTED ENTITIES ===
No specific medical entities detected in latest message.`;
  }
  
  const entitiesText = extractedEntities
    .map(entity => `${entity.type}: ${entity.entity}${entity.modifiers ? ` (${Object.entries(entity.modifiers).filter(([k,v]) => v).map(([k,v]) => `${k}: ${v}`).join(', ')})` : ''}`)
    .join('\n');
    
  return `
=== EXTRACTED ENTITIES ===
${entitiesText}`;
}

function getCurrentMessageSection(userMessage) {
  return `
=== CURRENT USER MESSAGE ===
"${userMessage}"`;
}

function getMedicalReasoningScaffold() {
  return `
=== MEDICAL REASONING REQUIRED ===
आपको निम्नलिखित steps follow करने हैं:

1. ACKNOWLEDGE: पहले सभी mentioned symptoms को Hinglish में restate करें
2. ANALYZE: Symptoms का medical significance बताएं
3. INQUIRE: हर unclear symptom के लिए specific questions पूछें:
   - Duration कितना है?
   - Severity कैसी है (mild/moderate/severe)?
   - Location exact कहाँ है?
   - Triggering factors क्या हैं?
   - Associated symptoms कोई और हैं?

4. DIAGNOSE: Possible conditions suggest करें probability के साथ:
   - Most likely (70-80%): [condition]
   - Possible (20-30%): [other conditions]
   - Rule out: [serious conditions to exclude]

5. RECOMMEND: 
   - Tests जो करवाने चाहिए
   - Safe medications with proper dosage
   - Lifestyle modifications
   - When to follow up`;
}

function getResponseRules() {
  return `
=== STRICT RESPONSE RULES ===
❌ NEVER say: "Main aapki baat samajh gaya", "Acha", "Theek hai", "Ok" without medical content
❌ NEVER give generic acknowledgments without specific medical follow-up
❌ NEVER ignore any mentioned symptom
❌ NEVER prescribe without asking about allergies (if not already known)
❌ NEVER recommend prescription drugs without proper medical reasoning

✅ ALWAYS restate symptoms in medical context
✅ ALWAYS ask clarifying questions for incomplete symptom description
✅ ALWAYS provide medical reasoning for your recommendations
✅ ALWAYS mention when to seek emergency care
✅ ALWAYS be specific about dosage, frequency, and duration for medicines

अगर आप symptoms को properly address नहीं कर सकते हैं, तो specific clarifying questions पूछें।

अब patient का message process करें और professional medical response दें:`;
}

/**
 * Generate follow-up questions based on incomplete symptom information
 * @param {Object} sessionCtx - Session context
 * @returns {Array} Array of suggested follow-up questions
 */
export function generateFollowUpQuestions(sessionCtx) {
  const questions = [];
  const symptoms = Object.values(sessionCtx.symptoms || {});
  
  symptoms.forEach(symptom => {
    const modifiers = symptom.modifiers || {};
    
    if (!modifiers.duration) {
      questions.push(`${symptom.name} कितने दिन से हो रहा है?`);
    }
    
    if (!modifiers.severity) {
      questions.push(`${symptom.name} कितना severe है - mild, moderate या severe?`);
    }
    
    if (!modifiers.location && needsLocation(symptom.name)) {
      questions.push(`${symptom.name} exact कहाँ हो रहा है?`);
    }
  });
  
  // General medical history questions
  if (!sessionCtx.userInfo.allergies || sessionCtx.userInfo.allergies.length === 0) {
    questions.push('कोई medicine से allergy है?');
  }
  
  if (symptoms.length > 0 && sessionCtx.testsOrdered.length === 0) {
    questions.push('पहले कोई tests करवाए हैं इस problem के लिए?');
  }
  
  return questions.slice(0, 3); // Return max 3 most important questions
}

/**
 * Generate differential diagnosis based on symptoms
 * @param {Object} sessionCtx - Session context
 * @returns {Object} Differential diagnosis with probabilities
 */
export function generateDifferentialDiagnosis(sessionCtx) {
  const symptoms = Object.values(sessionCtx.symptoms || {});
  const diagnoses = [];
  
  // Common symptom combinations for diagnosis
  const diagnosticPatterns = {
    'gastroenteritis': ['abdominal_pain', 'vomiting', 'diarrhea', 'fever'],
    'common_cold': ['cough', 'cold', 'throat_pain', 'mild_fever'],
    'migraine': ['headache', 'nausea', 'vomiting'],
    'food_poisoning': ['abdominal_pain', 'vomiting', 'diarrhea'],
    'viral_fever': ['fever', 'headache', 'weakness', 'body_ache'],
    'acid_reflux': ['chest_pain', 'burning', 'acidity'],
    'tension_headache': ['headache', 'stress', 'neck_pain']
  };
  
  // Calculate match scores
  for (const [condition, requiredSymptoms] of Object.entries(diagnosticPatterns)) {
    const symptomNames = symptoms.map(s => s.name);
    const matches = requiredSymptoms.filter(rs => 
      symptomNames.some(sn => sn.includes(rs) || rs.includes(sn))
    );
    
    if (matches.length >= 2) {
      const confidence = (matches.length / requiredSymptoms.length) * 100;
      diagnoses.push({
        condition: condition.replace('_', ' '),
        confidence: Math.round(confidence),
        matchedSymptoms: matches,
        reasoning: `Matches ${matches.length}/${requiredSymptoms.length} typical symptoms`
      });
    }
  }
  
  // Sort by confidence
  return diagnoses.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Check if symptom needs location specification
 */
function needsLocation(symptomName) {
  const locationRequiredSymptoms = [
    'pain', 'burning', 'swelling', 'itching', 'numbness', 'weakness'
  ];
  
  return locationRequiredSymptoms.some(ls => symptomName.includes(ls));
}

/**
 * Generate medicine recommendations based on symptoms
 * @param {Object} sessionCtx - Session context
 * @returns {Array} Array of medicine recommendations
 */
export function generateMedicineRecommendations(sessionCtx) {
  const symptoms = Object.values(sessionCtx.symptoms || {});
  const recommendations = [];
  
  symptoms.forEach(symptom => {
    const medicines = getMedicinesForSymptom(symptom.name);
    if (medicines.length > 0) {
      recommendations.push({
        symptom: symptom.name,
        medicines: medicines,
        note: 'Doctor की supervision में लें'
      });
    }
  });
  
  return recommendations;
}

function getMedicinesForSymptom(symptomName) {
  const medicineMap = {
    'fever': [
      { name: 'Paracetamol', dosage: '500mg', frequency: '8 घंटे में', duration: '3 दिन' },
      { name: 'Ibuprofen', dosage: '400mg', frequency: '8 घंटे में', duration: '3 दिन' }
    ],
    'headache': [
      { name: 'Paracetamol', dosage: '500mg', frequency: 'जरूरत के अनुसार', duration: '2-3 दिन' }
    ],
    'cough': [
      { name: 'Honey', dosage: '1 चम्मच', frequency: 'दिन में 3 बार', duration: '1 सप्ताह' },
      { name: 'Cough syrup', dosage: '5ml', frequency: 'दिन में 3 बार', duration: '5 दिन' }
    ],
    'acidity': [
      { name: 'Antacid', dosage: '1 tablet', frequency: 'खाने के बाद', duration: '1 सप्ताह' }
    ]
  };
  
  // Find matching medicines
  for (const [symptom, medicines] of Object.entries(medicineMap)) {
    if (symptomName.includes(symptom) || symptom.includes(symptomName)) {
      return medicines;
    }
  }
  
  return [];
}