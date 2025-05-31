// Test the enhanced symptom detection system
import { detectDiseaseFromText, detectSymptomsFromText, generateContextualResponse, generateMedicationSuggestions, DISEASE_DATABASE } from './enhanced-symptom-detection.js';

export function testSymptomDetection() {
  console.log('=== Testing Enhanced Symptom Detection ===');
  
  const testCases = [
    {
      input: "mujhe bukhar hai",
      expected: "fever"
    },
    {
      input: "pet me dard ho raha hai",
      expected: "stomach_pain"
    },
    {
      input: "mujhe maleria hai",
      expected: "malaria"
    },
    {
      input: "sugar ki problem hai",
      expected: "diabetes"
    },
    {
      input: "sir me dard hai",
      expected: "migraine"
    },
    {
      input: "khansi aa rahi hai",
      expected: "cough"
    }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n--- Test Case ${index + 1}: "${testCase.input}" ---`);
    
    // Test disease detection
    const diseaseResult = detectDiseaseFromText(testCase.input);
    console.log('Disease detected:', diseaseResult);
    
    // Test symptom detection
    const symptomResult = detectSymptomsFromText(testCase.input);
    console.log('Symptoms detected:', symptomResult);
    
    // Test medication generation
    const medications = generateMedicationSuggestions(diseaseResult, symptomResult.symptoms);
    console.log('Medications:', medications);
    
    console.log('---');
  });
  
  // Display available diseases
  console.log('\n=== Available Diseases in Database ===');
  Object.keys(DISEASE_DATABASE).forEach(disease => {
    console.log(`${disease}: ${DISEASE_DATABASE[disease].hinglish.join(', ')}`);
  });
}

export function debugDetection(input) {
  console.log(`\n=== Debug Detection for: "${input}" ===`);
  
  const normalizedInput = input.toLowerCase().trim();
  console.log('Normalized input:', normalizedInput);
  
  // Check each disease manually
  for (const [disease, info] of Object.entries(DISEASE_DATABASE)) {
    console.log(`\nChecking ${disease}:`);
    for (const keyword of info.hinglish) {
      const normalizedKeyword = keyword.toLowerCase();
      console.log(`  - Keyword: "${normalizedKeyword}"`);
      console.log(`  - Exact match: ${normalizedInput === normalizedKeyword}`);
      console.log(`  - Contains: ${normalizedInput.includes(normalizedKeyword)}`);
      
      if (normalizedInput.includes(normalizedKeyword)) {
        console.log(`  ✓ MATCH FOUND! Disease: ${disease}, Medication: ${info.medication}`);
      }
    }
  }
}