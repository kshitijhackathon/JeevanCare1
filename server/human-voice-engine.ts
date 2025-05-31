import { TextToSpeechClient } from '@google-cloud/text-to-speech';

interface VoiceConfig {
  languageCode: string;
  name: string;
  ssmlGender: 'MALE' | 'FEMALE';
  speakingRate: number;
  pitch: number;
  voiceType: 'Neural2' | 'Standard' | 'Wavenet';
}

export class HumanVoiceEngine {
  private client: TextToSpeechClient | null = null;
  
  // Enhanced voice configurations for human-like speech
  private voiceConfigs: Record<string, VoiceConfig> = {
    hindi: {
      languageCode: 'hi-IN',
      name: 'hi-IN-Neural2-A', // Female doctor voice
      ssmlGender: 'FEMALE',
      speakingRate: 0.95,
      pitch: 1.0,
      voiceType: 'Neural2'
    },
    english: {
      languageCode: 'en-IN',
      name: 'en-IN-Neural2-A', // Indian English female
      ssmlGender: 'FEMALE', 
      speakingRate: 0.9,
      pitch: 0.5,
      voiceType: 'Neural2'
    },
    bengali: {
      languageCode: 'bn-IN',
      name: 'bn-IN-Standard-A',
      ssmlGender: 'FEMALE',
      speakingRate: 0.9,
      pitch: 0.0,
      voiceType: 'Standard'
    },
    tamil: {
      languageCode: 'ta-IN', 
      name: 'ta-IN-Standard-A',
      ssmlGender: 'FEMALE',
      speakingRate: 0.9,
      pitch: 0.0,
      voiceType: 'Standard'
    },
    telugu: {
      languageCode: 'te-IN',
      name: 'te-IN-Standard-A', 
      ssmlGender: 'FEMALE',
      speakingRate: 0.9,
      pitch: 0.0,
      voiceType: 'Standard'
    },
    gujarati: {
      languageCode: 'gu-IN',
      name: 'gu-IN-Standard-A',
      ssmlGender: 'FEMALE',
      speakingRate: 0.9,
      pitch: 0.0,
      voiceType: 'Standard'
    }
  };

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      // Initialize with service account credentials if available
      this.client = new TextToSpeechClient();
      console.log('Google TTS client initialized successfully');
    } catch (error) {
      console.log('Google TTS initialization failed. Will use fallback voice generation.');
      this.client = null;
    }
  }

  // Generate human-like medical consultation speech
  async generateDoctorVoice(text: string, language: string, context: 'greeting' | 'diagnosis' | 'prescription' | 'farewell' = 'diagnosis'): Promise<Buffer | null> {
    if (!this.client) {
      console.log('Google TTS not available. Please provide Google Cloud credentials.');
      return null;
    }

    try {
      const voiceConfig = this.voiceConfigs[language] || this.voiceConfigs.hindi;
      
      // Enhance text with medical context and SSML
      const enhancedText = this.enhanceTextForMedicalContext(text, language, context);
      
      const request = {
        input: { ssml: enhancedText },
        voice: {
          languageCode: voiceConfig.languageCode,
          name: voiceConfig.name,
          ssmlGender: voiceConfig.ssmlGender as any
        },
        audioConfig: {
          audioEncoding: 'MP3' as any,
          speakingRate: this.getContextualSpeakingRate(context, voiceConfig.speakingRate),
          pitch: this.getContextualPitch(context, voiceConfig.pitch),
          volumeGainDb: 0.0,
          effectsProfileId: ['telephony-class-application'], // For clear medical communication
          sampleRateHertz: 24000 // High quality for professional consultation
        }
      };

      const [response] = await this.client.synthesizeSpeech(request);
      console.log(`Generated human-like voice for ${language} in ${context} context`);
      return response.audioContent as Buffer;

    } catch (error) {
      console.error('Human voice generation error:', error);
      return null;
    }
  }

  // Enhance text with SSML for human-like medical speech
  private enhanceTextForMedicalContext(text: string, language: string, context: string): string {
    let ssmlText = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis">`;
    
    // Add appropriate prosody based on context
    switch (context) {
      case 'greeting':
        ssmlText += `<prosody rate="medium" pitch="+3st" volume="medium">`;
        break;
      case 'diagnosis':
        ssmlText += `<prosody rate="slow" pitch="medium" volume="medium">`;
        break;
      case 'prescription':
        ssmlText += `<prosody rate="x-slow" pitch="low" volume="loud">`;
        break;
      case 'farewell':
        ssmlText += `<prosody rate="medium" pitch="+2st" volume="medium">`;
        break;
      default:
        ssmlText += `<prosody rate="medium" pitch="medium" volume="medium">`;
    }

    // Split into sentences and add natural pauses
    const sentences = text.split(/[।\.\!\?]+/).filter(s => s.trim());
    
    sentences.forEach((sentence, index) => {
      const trimmedSentence = sentence.trim();
      if (trimmedSentence) {
        // Add emphasis on medical terms
        let enhancedSentence = this.addMedicalEmphasis(trimmedSentence, language);
        
        ssmlText += `<s>${enhancedSentence}</s>`;
        
        // Add contextual pauses
        if (index < sentences.length - 1) {
          if (context === 'prescription') {
            ssmlText += `<break time="1s"/>`; // Longer pauses for prescriptions
          } else {
            ssmlText += `<break time="500ms"/>`;
          }
        }
      }
    });
    
    ssmlText += `</prosody></speak>`;
    return ssmlText;
  }

  // Add emphasis on important medical terms
  private addMedicalEmphasis(sentence: string, language: string): string {
    const medicalTerms = {
      hindi: ['दवा', 'गोली', 'खुराक', 'दिन', 'बार', 'खाना', 'पानी', 'आराम', 'जांच', 'डॉक्टर'],
      english: ['medicine', 'tablet', 'dosage', 'times', 'daily', 'food', 'water', 'rest', 'test', 'doctor'],
      bengali: ['ওষুধ', 'ট্যাবলেট', 'ডোজ', 'বার', 'দিন', 'খাবার', 'পানি'],
      tamil: ['மருந்து', 'மாத்திரை', 'அளவு', 'முறை', 'நாள்', 'உணவு', 'தண்ணீர்'],
      telugu: ['మందు', 'మాత్ర', 'మోతాదు', 'సార్లు', 'రోజు', 'ఆహారం', 'నీరు']
    };

    const terms = medicalTerms[language as keyof typeof medicalTerms] || medicalTerms.hindi;
    
    let enhancedSentence = sentence;
    terms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      enhancedSentence = enhancedSentence.replace(regex, `<emphasis level="moderate">${term}</emphasis>`);
    });

    return enhancedSentence;
  }

  // Adjust speaking rate based on context
  private getContextualSpeakingRate(context: string, baseRate: number): number {
    const adjustments = {
      greeting: 1.0,      // Normal speed for greetings
      diagnosis: 0.85,    // Slightly slower for diagnosis
      prescription: 0.7,  // Much slower for prescriptions
      farewell: 1.0       // Normal speed for farewell
    };

    return baseRate * (adjustments[context as keyof typeof adjustments] || 0.9);
  }

  // Adjust pitch based on context
  private getContextualPitch(context: string, basePitch: number): number {
    const adjustments = {
      greeting: 2.0,      // Higher pitch for friendly greeting
      diagnosis: 0.0,     // Neutral pitch for serious diagnosis
      prescription: -1.0, // Lower pitch for authority in prescriptions
      farewell: 1.0       // Slightly higher for positive farewell
    };

    return basePitch + (adjustments[context as keyof typeof adjustments] || 0);
  }

  // Generate greeting in patient's language
  async generatePersonalizedGreeting(patientName: string, language: string): Promise<Buffer | null> {
    const greetings = {
      hindi: `नमस्ते ${patientName} जी। मैं डॉक्टर हूं। आपकी तबियत कैसी है? कृपया अपनी समस्या बताइए।`,
      english: `Hello ${patientName}. I am your doctor. How are you feeling today? Please tell me about your health concerns.`,
      bengali: `নমস্কার ${patientName}। আমি ডাক্তার। আপনার শরীর কেমন লাগছে? আপনার সমস্যা বলুন।`,
      tamil: `வணக்கம் ${patientName}। நான் மருத்துவர். உங்கள் உடல்நிலை எப்படி உள்ளது? உங்கள் பிரச்சினையைச் சொல்லுங்கள்।`,
      telugu: `నమస్కారం ${patientName}। నేను డాక్టర్ను। మీ ఆరోగ్యం ఎలా ఉంది? మీ సమస్యను చెప్పండి।`
    };

    const greeting = greetings[language as keyof typeof greetings] || greetings.hindi;
    return await this.generateDoctorVoice(greeting, language, 'greeting');
  }

  // Generate prescription reading with clear pronunciation
  async generatePrescriptionReading(prescription: any, language: string): Promise<Buffer | null> {
    const prescriptionText = this.formatPrescriptionForSpeech(prescription, language);
    return await this.generateDoctorVoice(prescriptionText, language, 'prescription');
  }

  private formatPrescriptionForSpeech(prescription: any, language: string): string {
    const templates = {
      hindi: `आपकी दवाइयां लिख रहा हूं। ध्यान से सुनिए।
${prescription.medicines?.map((med: any, i: number) => 
  `${i + 1}. ${med.name}। ${med.dosage} दिन में ${med.frequency}। ${med.duration} तक लें। ${med.timing}।`
).join(' ')}

${prescription.tests?.length > 0 ? `जांच कराइए: ${prescription.tests.join(', ')}।` : ''}

${prescription.precautions?.length > 0 ? `सावधानियां: ${prescription.precautions.join(', ')}।` : ''}

${prescription.followUp || 'तीन दिन बाद मिलिए अगर आराम न हो।'}`,

      english: `I am prescribing your medicines. Please listen carefully.
${prescription.medicines?.map((med: any, i: number) => 
  `${i + 1}. ${med.name}. ${med.dosage} ${med.frequency} for ${med.duration}. ${med.timing}.`
).join(' ')}

${prescription.tests?.length > 0 ? `Tests required: ${prescription.tests.join(', ')}.` : ''}

${prescription.precautions?.length > 0 ? `Precautions: ${prescription.precautions.join(', ')}.` : ''}

${prescription.followUp || 'Come back after three days if you do not feel better.'}`
    };

    return templates[language as keyof typeof templates] || templates.hindi;
  }

  // Check if Google TTS is available
  isAvailable(): boolean {
    return this.client !== null;
  }

  // Get required credentials message
  getCredentialsMessage(): string {
    return "To enable human-like voice, please provide Google Cloud Text-to-Speech API credentials. The system will work with basic voice synthesis without these credentials.";
  }
}

export const humanVoiceEngine = new HumanVoiceEngine();