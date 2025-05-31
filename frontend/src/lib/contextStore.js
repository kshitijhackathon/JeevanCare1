/**
 * Session Context Store for Healthcare Assistant
 * Manages conversation context, symptoms, and medical history
 */

let sessionContext = {
  userInfo: {
    name: '',
    age: '',
    gender: '',
    allergies: [],
    medicalHistory: []
  },
  symptoms: {},
  testsOrdered: [],
  medicinesGiven: [],
  timeline: [],
  lastAssistantTurn: '',
  lastUserTurn: '',
  conversationStarted: null,
  sessionId: null
};

/**
 * Get current session context
 * @returns {Object} Current session context
 */
export function getCtx() {
  return { ...sessionContext };
}

/**
 * Update session context
 * @param {Object} newContext - New context data to merge
 */
export function setCtx(newContext) {
  if (typeof newContext === 'object' && newContext !== null) {
    sessionContext = { ...sessionContext, ...newContext };
    
    // Update last modified timestamp
    sessionContext.lastModified = new Date().toISOString();
  }
}

/**
 * Reset session context for new consultation
 */
export function resetCtx() {
  const newSessionId = generateSessionId();
  
  sessionContext = {
    userInfo: {
      name: '',
      age: '',
      gender: '',
      allergies: [],
      medicalHistory: []
    },
    symptoms: {},
    testsOrdered: [],
    medicinesGiven: [],
    timeline: [],
    lastAssistantTurn: '',
    lastUserTurn: '',
    conversationStarted: new Date().toISOString(),
    sessionId: newSessionId,
    lastModified: new Date().toISOString()
  };
  
  return sessionContext;
}

/**
 * Add user information to context
 * @param {Object} userInfo - User details
 */
export function setUserInfo(userInfo) {
  sessionContext.userInfo = { ...sessionContext.userInfo, ...userInfo };
  sessionContext.lastModified = new Date().toISOString();
}

/**
 * Add a conversation turn to timeline
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content - Message content
 * @param {Array} entities - Extracted entities (for user messages)
 */
export function addConversationTurn(role, content, entities = []) {
  const turn = {
    timestamp: new Date().toISOString(),
    role,
    content,
    entities: entities || []
  };
  
  sessionContext.timeline.push(turn);
  
  if (role === 'user') {
    sessionContext.lastUserTurn = content;
  } else if (role === 'assistant') {
    sessionContext.lastAssistantTurn = content;
  }
  
  sessionContext.lastModified = new Date().toISOString();
}

/**
 * Add ordered test to context
 * @param {string} testName - Name of the test
 * @param {string} reason - Reason for ordering
 */
export function addOrderedTest(testName, reason = '') {
  const test = {
    name: testName,
    reason,
    orderedAt: new Date().toISOString(),
    status: 'pending'
  };
  
  sessionContext.testsOrdered.push(test);
  sessionContext.lastModified = new Date().toISOString();
}

/**
 * Add prescribed medicine to context
 * @param {Object} medicine - Medicine details
 */
export function addPrescribedMedicine(medicine) {
  const prescribedMedicine = {
    ...medicine,
    prescribedAt: new Date().toISOString()
  };
  
  sessionContext.medicinesGiven.push(prescribedMedicine);
  sessionContext.lastModified = new Date().toISOString();
}

/**
 * Get conversation history formatted for LLM
 * @param {number} lastN - Number of recent turns to include
 * @returns {string} Formatted conversation history
 */
export function getConversationHistory(lastN = 6) {
  const recentTurns = sessionContext.timeline.slice(-lastN);
  
  return recentTurns
    .map(turn => `${turn.role.toUpperCase()}: ${turn.content}`)
    .join('\n');
}

/**
 * Get symptoms summary for LLM context
 * @returns {string} Formatted symptoms summary
 */
export function getSymptomsSummary() {
  const symptoms = Object.values(sessionContext.symptoms);
  
  if (symptoms.length === 0) {
    return 'No symptoms reported yet.';
  }
  
  return symptoms
    .map(symptom => {
      let summary = `${symptom.name}`;
      
      if (symptom.modifiers.location) {
        summary += ` (${symptom.modifiers.location})`;
      }
      
      if (symptom.modifiers.severity) {
        summary += ` - ${symptom.modifiers.severity} intensity`;
      }
      
      if (symptom.modifiers.duration) {
        summary += ` - duration: ${symptom.modifiers.duration}`;
      }
      
      if (symptom.occurrences > 1) {
        summary += ` (mentioned ${symptom.occurrences} times)`;
      }
      
      return summary;
    })
    .join('; ');
}

/**
 * Get medical context summary for LLM
 * @returns {Object} Structured medical context
 */
export function getMedicalContext() {
  return {
    userInfo: sessionContext.userInfo,
    symptomsCount: Object.keys(sessionContext.symptoms).length,
    symptomsSummary: getSymptomsSummary(),
    testsOrdered: sessionContext.testsOrdered.map(t => t.name),
    medicinesGiven: sessionContext.medicinesGiven.map(m => m.name || m.medication),
    conversationTurns: sessionContext.timeline.length,
    sessionDuration: getSessionDuration()
  };
}

/**
 * Check if context has sufficient information for prescription
 * @returns {Object} Assessment of context completeness
 */
export function assessContextCompleteness() {
  const assessment = {
    hasBasicInfo: !!sessionContext.userInfo.name && !!sessionContext.userInfo.age,
    hasSymptoms: Object.keys(sessionContext.symptoms).length > 0,
    hasDetailedSymptoms: false,
    missingInfo: [],
    readyForPrescription: false
  };
  
  // Check for detailed symptom information
  const symptoms = Object.values(sessionContext.symptoms);
  assessment.hasDetailedSymptoms = symptoms.some(s => 
    s.modifiers.duration || s.modifiers.severity || s.modifiers.location
  );
  
  // Identify missing information
  if (!sessionContext.userInfo.name) assessment.missingInfo.push('patient name');
  if (!sessionContext.userInfo.age) assessment.missingInfo.push('patient age');
  if (!sessionContext.userInfo.gender) assessment.missingInfo.push('patient gender');
  if (Object.keys(sessionContext.symptoms).length === 0) {
    assessment.missingInfo.push('symptoms description');
  }
  
  // Determine if ready for prescription
  assessment.readyForPrescription = assessment.hasBasicInfo && 
    assessment.hasSymptoms && 
    assessment.hasDetailedSymptoms;
  
  return assessment;
}

/**
 * Export context for external systems
 * @returns {string} JSON string of current context
 */
export function exportContext() {
  return JSON.stringify(sessionContext, null, 2);
}

/**
 * Import context from external source
 * @param {string} contextJson - JSON string of context
 */
export function importContext(contextJson) {
  try {
    const importedContext = JSON.parse(contextJson);
    sessionContext = { ...sessionContext, ...importedContext };
    sessionContext.lastModified = new Date().toISOString();
    return true;
  } catch (error) {
    console.error('Failed to import context:', error);
    return false;
  }
}

// Private helper functions

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getSessionDuration() {
  if (!sessionContext.conversationStarted) return '0 minutes';
  
  const startTime = new Date(sessionContext.conversationStarted);
  const currentTime = new Date();
  const durationMs = currentTime - startTime;
  const durationMinutes = Math.floor(durationMs / (1000 * 60));
  
  if (durationMinutes < 1) return 'less than 1 minute';
  if (durationMinutes === 1) return '1 minute';
  if (durationMinutes < 60) return `${durationMinutes} minutes`;
  
  const hours = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;
  
  if (hours === 1 && remainingMinutes === 0) return '1 hour';
  if (hours === 1) return `1 hour ${remainingMinutes} minutes`;
  if (remainingMinutes === 0) return `${hours} hours`;
  
  return `${hours} hours ${remainingMinutes} minutes`;
}