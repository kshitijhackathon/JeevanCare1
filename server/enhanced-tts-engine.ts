import { TextToSpeechClient } from '@google-cloud/text-to-speech';

interface VoiceConfig {
  languageCode: string;
  name: string;
  ssmlGender: string;
  voiceType: 'neural' | 'standard';
}

export class EnhancedTTSEngine {
  private client: TextToSpeechClient | null = null;
  private voiceConfigs: Record<string, VoiceConfig> = {
    hindi: {
      languageCode: 'hi-IN',
      name: 'hi-IN-Neural2-A',
      ssmlGender: 'FEMALE',
      voiceType: 'neural'
    },
    english: {
      languageCode: 'en-IN',
      name: 'en-IN-Neural2-A',
      ssmlGender: 'FEMALE',
      voiceType: 'neural'
    },
    bengali: {
      languageCode: 'bn-IN',
      name: 'bn-IN-Standard-A',
      ssmlGender: 'FEMALE',
      voiceType: 'standard'
    },
    tamil: {
      languageCode: 'ta-IN',
      name: 'ta-IN-Standard-A',
      ssmlGender: 'FEMALE',
      voiceType: 'standard'
    },
    telugu: {
      languageCode: 'te-IN',
      name: 'te-IN-Standard-A',
      ssmlGender: 'FEMALE',
      voiceType: 'standard'
    }
  };

  constructor() {
    // Initialize Google Cloud TTS client if credentials are available
    try {
      this.client = new TextToSpeechClient();
    } catch (error) {
      console.log('Google Cloud TTS not available, using fallback');
    }
  }

  async generateSpeech(text: string, language: string): Promise<Buffer | null> {
    try {
      if (this.client) {
        return await this.generateGoogleTTS(text, language);
      } else {
        return await this.generateFallbackTTS(text, language);
      }
    } catch (error) {
      console.error('TTS generation failed:', error);
      return null;
    }
  }

  private async generateGoogleTTS(text: string, language: string): Promise<Buffer | null> {
    try {
      const voiceConfig = this.voiceConfigs[language] || this.voiceConfigs.english;
      
      // Enhance text with SSML for more natural speech
      const ssmlText = this.enhanceTextWithSSML(text, language);
      
      const request = {
        input: { ssml: ssmlText },
        voice: {
          languageCode: voiceConfig.languageCode,
          name: voiceConfig.name,
          ssmlGender: voiceConfig.ssmlGender as any
        },
        audioConfig: {
          audioEncoding: 'MP3' as any,
          speakingRate: 0.9,
          pitch: 0.0,
          volumeGainDb: 0.0,
          effectsProfileId: ['telephony-class-application']
        }
      };

      const [response] = await this.client.synthesizeSpeech(request);
      return response.audioContent as Buffer;
    } catch (error) {
      console.error('Google TTS error:', error);
      return null;
    }
  }

  private async generateFallbackTTS(text: string, language: string): Promise<Buffer | null> {
    // For systems without Google TTS, use browser-based or system TTS
    console.log(`Fallback TTS for ${language}: ${text}`);
    return null;
  }

  private enhanceTextWithSSML(text: string, language: string): string {
    // Add SSML tags for more natural speech
    let ssmlText = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis">`;
    
    // Add prosody for medical consultation tone
    ssmlText += `<prosody rate="medium" pitch="+2st" volume="medium">`;
    
    // Split text into sentences and add appropriate pauses
    const sentences = text.split(/[।\.!?]+/).filter(s => s.trim());
    
    sentences.forEach((sentence, index) => {
      ssmlText += `<s>${sentence.trim()}</s>`;
      
      // Add pause between sentences for clarity
      if (index < sentences.length - 1) {
        ssmlText += `<break time="500ms"/>`;
      }
    });
    
    ssmlText += `</prosody></speak>`;
    
    return ssmlText;
  }

  // Enhanced medical speech patterns for different languages
  private getMedicalGreeting(language: string): string {
    const greetings = {
      hindi: 'नमस्ते! मैं डॉक्टर एआई हूं। आपकी स्वास्थ्य संबंधी समस्या बताइए।',
      english: 'Hello! I am Dr. AI, your virtual physician. Please describe your health concerns.',
      bengali: 'নমস্কার! আমি ডক্টর এআই। আপনার স্বাস্থ্য সমস্যার কথা বলুন।',
      tamil: 'வணக்கம்! நான் டாக்டர் AI. உங்கள் உடல்நலப் பிரச்சினையைச் சொல்லுங்கள்.',
      telugu: 'నమస్కారం! నేను డాక్టర్ AI. మీ ఆరోగ్య సమస్యలను చెప్పండి।'
    };
    
    return greetings[language as keyof typeof greetings] || greetings.english;
  }

  async generateGreeting(language: string): Promise<Buffer | null> {
    const greeting = this.getMedicalGreeting(language);
    return await this.generateSpeech(greeting, language);
  }

  // Generate questions in natural voice
  async generateFollowUpQuestion(question: string, language: string): Promise<Buffer | null> {
    // Add appropriate medical questioning tone
    const enhancedQuestion = this.enhanceQuestionTone(question, language);
    return await this.generateSpeech(enhancedQuestion, language);
  }

  private enhanceQuestionTone(question: string, language: string): string {
    // Add empathetic tone to medical questions
    const empathyPhrases = {
      hindi: 'कृपया बताएं कि ',
      english: 'Could you please tell me ',
      bengali: 'দয়া করে বলুন ',
      tamil: 'தயவுசெய்து சொல்லுங்கள் ',
      telugu: 'దయచేసి చెప్పండి '
    };

    const prefix = empathyPhrases[language as keyof typeof empathyPhrases] || empathyPhrases.english;
    return `${prefix}${question}`;
  }

  // Generate prescription reading with clear pronunciation
  async generatePrescriptionReading(prescription: any, language: string): Promise<Buffer | null> {
    const prescriptionText = this.formatPrescriptionForSpeech(prescription, language);
    return await this.generateSpeech(prescriptionText, language);
  }

  private formatPrescriptionForSpeech(prescription: any, language: string): string {
    const intro = {
      hindi: 'आपके लिए दवाओं की सूची है:',
      english: 'Here is your medication list:',
      bengali: 'এখানে আপনার ওষুধের তালিকা:',
      tamil: 'உங்களுக்கான மருந்து பட்டியல்:',
      telugu: 'మీ మందుల జాబితా ఇక్కడ ఉంది:'
    };

    let speech = intro[language as keyof typeof intro] || intro.english;
    
    if (prescription.medicines && prescription.medicines.length > 0) {
      prescription.medicines.forEach((med: any, index: number) => {
        speech += ` ${index + 1}. ${med.name}, ${med.dose}, ${med.freq}, ${med.days} दिन।`;
      });
    }

    return speech;
  }
}

export const enhancedTTSEngine = new EnhancedTTSEngine();