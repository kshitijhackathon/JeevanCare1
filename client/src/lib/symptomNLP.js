/**
 * Browser-based Symptom NLP Module for Hinglish Healthcare Assistant
 * Handles symptom extraction, normalization, and context management
 * No server dependencies - runs 100% in browser
 */

import { symptomSynonyms } from './symptom_synonyms.js';

/**
 * Extract medical entities from user text
 * @param {string} text - User input text
 * @param {string} lang - Language code (hi-IN, en-US, etc.)
 * @returns {Array} Array of {entity, type, original, location, severity, duration}
 */
export function extractEntities(text, lang = 'hi-IN') {
  if (!text || typeof text !== 'string') return [];
  
  const entities = [];
  const normalizedText = text.toLowerCase().trim();
  
  // Tokenize with support for Hindi/Hinglish
  const tokens = tokenizeText(normalizedText);
  
  // Extract symptoms with multi-word pattern matching
  const symptoms = extractSymptoms(tokens, normalizedText);
  entities.push(...symptoms);
  
  // Extract body parts and locations
  const locations = extractBodyParts(tokens, normalizedText);
  entities.push(...locations);
  
  // Extract duration expressions
  const durations = extractDurations(tokens, normalizedText);
  entities.push(...durations);
  
  // Extract severity indicators
  const severities = extractSeverities(tokens, normalizedText);
  entities.push(...severities);
  
  // Merge related entities (e.g., "pet" + "dard" = "abdominal pain")
  return mergeRelatedEntities(entities, normalizedText);
}

/**
 * Normalize a word using synonym mapping
 * @param {string} word - Input word
 * @returns {string} Canonical medical term
 */
export function normalizeWord(word) {
  if (!word || typeof word !== 'string') return word;
  
  const normalized = word.toLowerCase().trim();
  
  // Direct lookup in synonym map
  if (symptomSynonyms[normalized]) {
    return symptomSynonyms[normalized];
  }
  
  // Handle variations and compound words
  const variations = generateWordVariations(normalized);
  for (const variation of variations) {
    if (symptomSynonyms[variation]) {
      return symptomSynonyms[variation];
    }
  }
  
  return normalized; // Return original if no mapping found
}

/**
 * Merge new entities with existing session context
 * @param {Array} entities - New extracted entities
 * @param {Object} sessionCtx - Current session context
 * @returns {Object} Updated session context
 */
export function mergeWithContext(entities, sessionCtx = {}) {
  // Initialize context structure if empty
  if (!sessionCtx.symptoms) sessionCtx.symptoms = {};
  if (!sessionCtx.timeline) sessionCtx.timeline = [];
  if (!sessionCtx.userInfo) sessionCtx.userInfo = {};
  if (!sessionCtx.testsOrdered) sessionCtx.testsOrdered = [];
  if (!sessionCtx.medicinesGiven) sessionCtx.medicinesGiven = [];
  
  const timestamp = new Date().toISOString();
  
  // Process each entity
  entities.forEach(entity => {
    switch (entity.type) {
      case 'symptom':
        updateSymptomInContext(entity, sessionCtx, timestamp);
        break;
      case 'body_part':
        associateBodyPartWithSymptoms(entity, sessionCtx);
        break;
      case 'duration':
        updateDurationInContext(entity, sessionCtx);
        break;
      case 'severity':
        updateSeverityInContext(entity, sessionCtx);
        break;
    }
  });
  
  // Add to timeline
  sessionCtx.timeline.push({
    timestamp,
    entities,
    type: 'user_input'
  });
  
  return sessionCtx;
}

// Private helper functions

function tokenizeText(text) {
  // Support for Devanagari and Latin scripts
  const tokenRegex = /[\u0900-\u097F\w]+/gu;
  return text.match(tokenRegex) || [];
}

function extractSymptoms(tokens, fullText) {
  const symptoms = [];
  
  // Multi-word symptom patterns
  const multiWordPatterns = [
    { pattern: /(?:pet|paet|stomach)\s*(?:mein|me)?\s*(?:dard|pain|ache)/gi, 
      symptom: 'abdominal_pain', location: 'abdomen' },
    { pattern: /(?:seene|chest|sina)\s*(?:mein|me)?\s*(?:dard|pain|jalan|burning)/gi, 
      symptom: 'chest_pain', location: 'chest' },
    { pattern: /(?:sar|head|sir)\s*(?:mein|me)?\s*(?:dard|pain|ache)/gi, 
      symptom: 'headache', location: 'head' },
    { pattern: /(?:kamr|kamar|back)\s*(?:mein|me)?\s*(?:dard|pain)/gi, 
      symptom: 'back_pain', location: 'back' },
    { pattern: /(?:gale|throat|gala)\s*(?:mein|me)?\s*(?:dard|pain|kharas)/gi, 
      symptom: 'throat_pain', location: 'throat' },
    { pattern: /(?:loose\s*motion|diarrhea|dast|patlaa)/gi, 
      symptom: 'diarrhea', location: 'digestive' },
    { pattern: /(?:cough|khaansi|khasi)/gi, 
      symptom: 'cough', location: 'respiratory' },
    { pattern: /(?:cold|zukaam|jukam|nazla)/gi, 
      symptom: 'cold', location: 'respiratory' }
  ];
  
  // Check multi-word patterns first
  multiWordPatterns.forEach(({ pattern, symptom, location }) => {
    const matches = fullText.match(pattern);
    if (matches) {
      matches.forEach(match => {
        symptoms.push({
          entity: symptom,
          type: 'symptom',
          original: match,
          location: location,
          confidence: 0.9
        });
      });
    }
  });
  
  // Single word symptom mapping
  tokens.forEach(token => {
    const normalized = normalizeWord(token);
    if (isSymptom(normalized)) {
      symptoms.push({
        entity: normalized,
        type: 'symptom',
        original: token,
        confidence: 0.7
      });
    }
  });
  
  return symptoms;
}

function extractBodyParts(tokens, fullText) {
  const bodyParts = [];
  const bodyPartMap = {
    'pet': 'abdomen', 'paet': 'abdomen', 'stomach': 'abdomen',
    'seena': 'chest', 'sina': 'chest', 'chest': 'chest',
    'sar': 'head', 'sir': 'head', 'head': 'head',
    'gala': 'throat', 'throat': 'throat',
    'kamr': 'back', 'kamar': 'back', 'back': 'back',
    'haath': 'hand', 'hand': 'hand', 'arm': 'arm',
    'paer': 'leg', 'pair': 'leg', 'leg': 'leg', 'foot': 'foot',
    'aankh': 'eye', 'eyes': 'eye', 'eye': 'eye',
    'kan': 'ear', 'ear': 'ear',
    'naak': 'nose', 'nose': 'nose'
  };
  
  tokens.forEach(token => {
    const normalized = token.toLowerCase();
    if (bodyPartMap[normalized]) {
      bodyParts.push({
        entity: bodyPartMap[normalized],
        type: 'body_part',
        original: token,
        confidence: 0.8
      });
    }
  });
  
  return bodyParts;
}

function extractDurations(tokens, fullText) {
  const durations = [];
  
  // Duration patterns
  const durationPatterns = [
    { pattern: /(\d+)\s*(?:din|day|days)/gi, unit: 'days' },
    { pattern: /(\d+)\s*(?:ghante|hour|hours|ghanta)/gi, unit: 'hours' },
    { pattern: /(\d+)\s*(?:hafte|week|weeks)/gi, unit: 'weeks' },
    { pattern: /(\d+)\s*(?:mahine|month|months)/gi, unit: 'months' },
    { pattern: /(kal se|yesterday|since yesterday)/gi, value: '1', unit: 'days' },
    { pattern: /(parsho se|day before)/gi, value: '2', unit: 'days' },
    { pattern: /(abhi|just now|now)/gi, value: '0', unit: 'minutes' }
  ];
  
  durationPatterns.forEach(({ pattern, unit, value }) => {
    const matches = fullText.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const extractedValue = value || (match.match(/\d+/) ? match.match(/\d+/)[0] : '1');
        durations.push({
          entity: `${extractedValue}_${unit}`,
          type: 'duration',
          original: match,
          value: extractedValue,
          unit: unit,
          confidence: 0.8
        });
      });
    }
  });
  
  return durations;
}

function extractSeverities(tokens, fullText) {
  const severities = [];
  const severityMap = {
    'bahut': 'severe', 'very': 'severe', 'extreme': 'severe',
    'zyada': 'moderate', 'moderate': 'moderate', 'medium': 'moderate',
    'thoda': 'mild', 'little': 'mild', 'mild': 'mild', 'halka': 'mild',
    'kam': 'mild', 'less': 'mild',
    'tej': 'severe', 'intense': 'severe', 'sharp': 'severe',
    'dheema': 'mild', 'slow': 'mild'
  };
  
  tokens.forEach(token => {
    const normalized = token.toLowerCase();
    if (severityMap[normalized]) {
      severities.push({
        entity: severityMap[normalized],
        type: 'severity',
        original: token,
        confidence: 0.7
      });
    }
  });
  
  return severities;
}

function mergeRelatedEntities(entities, fullText) {
  const merged = [];
  const processed = new Set();
  
  // Group symptoms with their modifiers
  entities.forEach((entity, index) => {
    if (processed.has(index)) return;
    
    if (entity.type === 'symptom') {
      const relatedEntities = findRelatedEntities(entity, entities, fullText);
      const mergedEntity = {
        ...entity,
        modifiers: {
          location: relatedEntities.bodyParts[0]?.entity,
          duration: relatedEntities.durations[0]?.entity,
          severity: relatedEntities.severities[0]?.entity
        }
      };
      
      merged.push(mergedEntity);
      processed.add(index);
      
      // Mark related entities as processed
      relatedEntities.all.forEach(related => {
        const relatedIndex = entities.indexOf(related);
        if (relatedIndex !== -1) processed.add(relatedIndex);
      });
    }
  });
  
  // Add unprocessed entities
  entities.forEach((entity, index) => {
    if (!processed.has(index)) {
      merged.push(entity);
    }
  });
  
  return merged;
}

function findRelatedEntities(symptom, allEntities, fullText) {
  const bodyParts = allEntities.filter(e => e.type === 'body_part');
  const durations = allEntities.filter(e => e.type === 'duration');
  const severities = allEntities.filter(e => e.type === 'severity');
  
  return {
    bodyParts,
    durations,
    severities,
    all: [...bodyParts, ...durations, ...severities]
  };
}

function isSymptom(word) {
  const symptomTerms = new Set([
    'pain', 'fever', 'headache', 'nausea', 'vomiting', 'diarrhea', 'cough',
    'cold', 'burning', 'swelling', 'weakness', 'dizziness', 'fatigue',
    'constipation', 'bloating', 'indigestion', 'acidity', 'gas'
  ]);
  
  return symptomTerms.has(word);
}

function generateWordVariations(word) {
  const variations = [word];
  
  // Common spelling variations for Hinglish
  const spellingMaps = {
    'aa': ['a', 'aa'],
    'ee': ['i', 'ee'],
    'oo': ['u', 'oo'],
    'kh': ['k', 'kh'],
    'gh': ['g', 'gh'],
    'th': ['t', 'th'],
    'dh': ['d', 'dh']
  };
  
  // Generate variations based on common misspellings
  for (const [original, replacements] of Object.entries(spellingMaps)) {
    if (word.includes(original)) {
      replacements.forEach(replacement => {
        variations.push(word.replace(new RegExp(original, 'g'), replacement));
      });
    }
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

function updateSymptomInContext(entity, sessionCtx, timestamp) {
  const symptomKey = entity.entity;
  
  if (!sessionCtx.symptoms[symptomKey]) {
    sessionCtx.symptoms[symptomKey] = {
      name: symptomKey,
      original: entity.original,
      firstReported: timestamp,
      occurrences: 0,
      modifiers: {}
    };
  }
  
  // Update occurrence count
  sessionCtx.symptoms[symptomKey].occurrences++;
  sessionCtx.symptoms[symptomKey].lastReported = timestamp;
  
  // Update modifiers if present
  if (entity.modifiers) {
    Object.assign(sessionCtx.symptoms[symptomKey].modifiers, entity.modifiers);
  }
  
  if (entity.location) {
    sessionCtx.symptoms[symptomKey].modifiers.location = entity.location;
  }
}

function associateBodyPartWithSymptoms(entity, sessionCtx) {
  // Find recent symptoms to associate with this body part
  const recentSymptoms = Object.keys(sessionCtx.symptoms);
  if (recentSymptoms.length > 0) {
    const lastSymptom = recentSymptoms[recentSymptoms.length - 1];
    if (!sessionCtx.symptoms[lastSymptom].modifiers.location) {
      sessionCtx.symptoms[lastSymptom].modifiers.location = entity.entity;
    }
  }
}

function updateDurationInContext(entity, sessionCtx) {
  // Associate with the most recent symptom
  const recentSymptoms = Object.keys(sessionCtx.symptoms);
  if (recentSymptoms.length > 0) {
    const lastSymptom = recentSymptoms[recentSymptoms.length - 1];
    sessionCtx.symptoms[lastSymptom].modifiers.duration = entity.entity;
  }
}

function updateSeverityInContext(entity, sessionCtx) {
  // Associate with the most recent symptom
  const recentSymptoms = Object.keys(sessionCtx.symptoms);
  if (recentSymptoms.length > 0) {
    const lastSymptom = recentSymptoms[recentSymptoms.length - 1];
    sessionCtx.symptoms[lastSymptom].modifiers.severity = entity.entity;
  }
}

export { symptomSynonyms };