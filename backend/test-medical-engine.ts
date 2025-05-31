import { diseasePredictionEngine } from './disease-prediction-engine';

// Test the medical engine functionality
function testMedicalEngine() {
  console.log('=== Testing Disease Prediction Engine ===');
  
  // Test 1: Symptom extraction
  console.log('\n1. Testing Symptom Extraction:');
  const testCases = [
    "I have fever and headache",
    "मुझे बुखार और सिरदर्द है",
    "I am feeling tired with body pain and cough",
    "Pet mein dard hai aur ulti ho rahi hai",
    "Chest pain and shortness of breath"
  ];
  
  testCases.forEach(text => {
    const symptoms = diseasePredictionEngine.extractMedicalSymptoms(text);
    console.log(`Input: "${text}" -> Symptoms: [${symptoms.join(', ')}]`);
  });
  
  // Test 2: Disease prediction
  console.log('\n2. Testing Disease Prediction:');
  const symptomSets = [
    ['fever', 'headache', 'body_aches'],
    ['cough', 'fever', 'sore_throat'],
    ['stomach_pain', 'nausea', 'vomiting'],
    ['chest_pain', 'shortness_of_breath'],
    ['burning_urination', 'frequent_urination']
  ];
  
  symptomSets.forEach(symptoms => {
    const prediction = diseasePredictionEngine.predictDisease(symptoms);
    console.log(`Symptoms: [${symptoms.join(', ')}] -> Disease: ${prediction?.disease} (${prediction?.confidence}% confidence)`);
  });
  
  // Test 3: Medicine recommendations
  console.log('\n3. Testing Medicine Recommendations:');
  const diseases = ['Common Cold', 'UTI', 'Gastritis'];
  diseases.forEach(disease => {
    const medicines = diseasePredictionEngine.getMedicinesForDisease(disease, 'moderate');
    console.log(`${disease} -> ${medicines.length} medicines recommended`);
    medicines.slice(0, 2).forEach(med => {
      console.log(`  - ${med.name} (₹${med.price}) - ${med.composition}`);
    });
  });
  
  // Test 4: Full consultation
  console.log('\n4. Testing Full Medical Consultation:');
  const patientDetails = {
    name: 'Test Patient',
    age: '30',
    gender: 'Male',
    bloodGroup: 'O+'
  };
  
  diseasePredictionEngine.generateMedicalConsultation(
    'I have fever, headache and body pain since 2 days',
    patientDetails
  ).then(consultation => {
    console.log('Consultation generated successfully:');
    console.log(`- Diagnosis: ${consultation.diagnosis}`);
    console.log(`- Confidence: ${consultation.confidence}%`);
    console.log(`- Medications: ${consultation.prescription?.medications?.length || 0}`);
    console.log(`- Instructions: ${consultation.prescription?.instructions?.length || 0}`);
    console.log(`- Total Cost: ${consultation.prescription?.totalCost || 'N/A'}`);
  }).catch(error => {
    console.error('Error in consultation:', error);
  });
}

// Run the test
testMedicalEngine();