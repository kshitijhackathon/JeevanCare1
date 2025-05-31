// Enhanced Text-to-Speech Engine for AI Doctor Consultation
// Uses Web Speech API with advanced voice processing

interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  lang: string;
  voiceName?: string;
}

interface TTSOptions {
  text: string;
  language: string;
  gender?: 'male' | 'female';
  speed?: 'slow' | 'normal' | 'fast';
  emotion?: 'calm' | 'warm' | 'professional';
}

export class EnhancedTTSEngine {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;

  constructor() {
    this.synth = window.speechSynthesis;
    this.initializeVoices();
  }

  private async initializeVoices(): Promise<void> {
    return new Promise((resolve) => {
      const loadVoices = () => {
        this.voices = this.synth.getVoices();
        this.isInitialized = true;
        resolve();
      };

      if (this.synth.getVoices().length > 0) {
        loadVoices();
      } else {
        this.synth.addEventListener('voiceschanged', loadVoices, { once: true });
      }
    });
  }

  // Language code mapping for Indian languages
  private getLanguageCode(language: string): string {
    const languageMap: { [key: string]: string } = {
      'eng_Latn': 'en-IN',
      'hin_Deva': 'hi-IN',
      'ben_Beng': 'bn-IN',
      'tam_Taml': 'ta-IN',
      'tel_Telu': 'te-IN',
      'mar_Deva': 'mr-IN',
      'guj_Gujr': 'gu-IN',
      'kan_Knda': 'kn-IN',
      'mal_Mlym': 'ml-IN',
      'pan_Guru': 'pa-IN',
      'urd_Arab': 'ur-IN',
      'ori_Orya': 'or-IN',
      'asm_Beng': 'as-IN'
    };

    return languageMap[language] || 'en-IN';
  }

  // Find best voice for the given language and preferences
  private findBestVoice(langCode: string, gender?: 'male' | 'female'): SpeechSynthesisVoice | null {
    if (!this.isInitialized) return null;

    // Filter voices by language
    let matchingVoices = this.voices.filter(voice => 
      voice.lang.startsWith(langCode.split('-')[0]) || 
      voice.lang === langCode
    );

    // If no exact language match, fallback to English-India
    if (matchingVoices.length === 0) {
      matchingVoices = this.voices.filter(voice => 
        voice.lang.includes('en') && voice.lang.includes('IN')
      );
    }

    // If still no match, use any English voice
    if (matchingVoices.length === 0) {
      matchingVoices = this.voices.filter(voice => voice.lang.startsWith('en'));
    }

    // Filter by gender preference if specified
    if (gender && matchingVoices.length > 1) {
      const genderFilteredVoices = matchingVoices.filter(voice => {
        const name = voice.name.toLowerCase();
        if (gender === 'female') {
          return name.includes('female') || name.includes('woman') || 
                 name.includes('sara') || name.includes('zira') || 
                 name.includes('priya') || name.includes('raveena');
        } else {
          return name.includes('male') || name.includes('man') || 
                 name.includes('david') || name.includes('mark') || 
                 name.includes('ravi') || name.includes('hemant');
        }
      });
      
      if (genderFilteredVoices.length > 0) {
        matchingVoices = genderFilteredVoices;
      }
    }

    // Prefer local voices over online voices for better performance
    const localVoices = matchingVoices.filter(voice => voice.localService);
    return localVoices.length > 0 ? localVoices[0] : matchingVoices[0] || null;
  }

  // Get voice settings based on options
  private getVoiceSettings(options: TTSOptions): VoiceSettings {
    const langCode = this.getLanguageCode(options.language);
    
    let rate = 0.9; // Slightly slower for medical consultation
    let pitch = 1.0;
    
    // Adjust rate based on speed preference
    switch (options.speed) {
      case 'slow': rate = 0.7; break;
      case 'fast': rate = 1.2; break;
      default: rate = 0.9; break;
    }

    // Adjust pitch based on emotion
    switch (options.emotion) {
      case 'warm': pitch = 1.1; break;
      case 'calm': pitch = 0.95; break;
      case 'professional': pitch = 1.0; break;
      default: pitch = 1.0; break;
    }

    return {
      rate,
      pitch,
      volume: 0.8,
      lang: langCode
    };
  }

  // Enhanced text preprocessing for medical content
  private preprocessText(text: string, language: string): string {
    let processedText = text;

    // Add natural pauses for medical terminology
    processedText = processedText.replace(/\./g, '. ');
    processedText = processedText.replace(/,/g, ', ');
    processedText = processedText.replace(/;/g, '; ');
    
    // Add breathing pauses for long sentences
    const sentences = processedText.split('. ');
    if (sentences.length > 2) {
      processedText = sentences.join('. ... ');
    }

    // Add emphasis for important medical terms
    processedText = processedText.replace(
      /\b(symptoms?|diagnosis|treatment|medication|dosage|doctor|emergency|urgent)\b/gi, 
      (match) => `${match}`
    );

    return processedText.trim();
  }

  // Main TTS function
  async speak(options: TTSOptions): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeVoices();
    }

    return new Promise((resolve, reject) => {
      // Stop any ongoing speech
      this.synth.cancel();

      const settings = this.getVoiceSettings(options);
      const voice = this.findBestVoice(settings.lang, options.gender);
      const processedText = this.preprocessText(options.text, options.language);

      const utterance = new SpeechSynthesisUtterance(processedText);
      
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;
      utterance.lang = settings.lang;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`TTS Error: ${event.error}`));
      
      // Add natural pauses for medical consultation
      utterance.onboundary = (event) => {
        if (event.name === 'sentence') {
          // Small pause between sentences for clarity
          setTimeout(() => {}, 200);
        }
      };

      this.synth.speak(utterance);
    });
  }

  // Generate medical greeting with appropriate tone
  async speakMedicalGreeting(language: string, patientName?: string): Promise<void> {
    const greetings: { [key: string]: string } = {
      'eng_Latn': `Hello ${patientName || 'there'}! I am Dr. AI, your virtual physician. I'm here to help you with your health concerns today. Please feel comfortable sharing your symptoms with me.`,
      'hin_Deva': `नमस्ते ${patientName || ''}! मैं डॉ. एआई हूं, आपका वर्चुअल चिकित्सक। मैं आज आपकी स्वास्थ्य समस्याओं में आपकी सहायता के लिए यहां हूं।`,
      'ben_Beng': `নমস্কার ${patientName || ''}! আমি ডাঃ এআই, আপনার ভার্চুয়াল চিকিৎসক। আমি আজ আপনার স্বাস্থ্য সমস্যায় সাহায্য করতে এসেছি।`,
      'tam_Taml': `வணக்கம் ${patientName || ''}! நான் டாக்டர் AI, உங்கள் மெய்நிகர் மருத்துவர். இன்று உங்கள் உடல்நலப் பிரச்சினைகளில் உங்களுக்கு உதவ நான் இங்கே இருக்கிறேன்।`
    };

    const greeting = greetings[language] || greetings['eng_Latn'];
    
    await this.speak({
      text: greeting,
      language,
      gender: 'female',
      speed: 'normal',
      emotion: 'warm'
    });
  }

  // Generate follow-up questions with medical tone
  async speakFollowUpQuestion(question: string, language: string): Promise<void> {
    await this.speak({
      text: question,
      language,
      gender: 'female',
      speed: 'normal',
      emotion: 'professional'
    });
  }

  // Read prescription with clear pronunciation
  async speakPrescription(prescription: any, language: string): Promise<void> {
    let prescriptionText = "Here is your prescription. ";
    
    if (prescription.medicines) {
      prescriptionText += "You have been prescribed the following medications: ";
      prescription.medicines.forEach((med: any, index: number) => {
        prescriptionText += `${index + 1}. ${med.name}, ${med.dosage}, ${med.frequency}. `;
      });
    }

    if (prescription.instructions) {
      prescriptionText += " Important instructions: " + prescription.instructions.join(". ");
    }

    await this.speak({
      text: prescriptionText,
      language,
      gender: 'female',
      speed: 'slow', // Slower for prescription details
      emotion: 'professional'
    });
  }

  // Stop current speech
  stop(): void {
    this.synth.cancel();
  }

  // Check if TTS is available
  isAvailable(): boolean {
    return 'speechSynthesis' in window;
  }

  // Get available voices for language
  getAvailableVoices(language: string): SpeechSynthesisVoice[] {
    const langCode = this.getLanguageCode(language);
    return this.voices.filter(voice => 
      voice.lang.startsWith(langCode.split('-')[0]) || voice.lang === langCode
    );
  }
}

// Create singleton instance
export const ttsEngine = new EnhancedTTSEngine();