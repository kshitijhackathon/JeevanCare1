interface VoiceConfig {
  lang: string;
  rate: number;
  pitch: number;
  volume: number;
  voiceNames: string[];
  culturalTone: 'formal' | 'friendly' | 'caring' | 'professional';
  pauseDuration: number;
}

interface LanguageVoiceMap {
  [key: string]: VoiceConfig;
}

export class VoiceToneAdapter {
  private static instance: VoiceToneAdapter;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoices: Map<string, SpeechSynthesisVoice> = new Map();

  private languageConfigs: LanguageVoiceMap = {
    'hindi': {
      lang: 'hi-IN',
      rate: 0.8,
      pitch: 1.0,
      volume: 0.9,
      voiceNames: ['Google हिन्दी', 'Microsoft Hemant', 'Microsoft Kalpana', 'Lekha'],
      culturalTone: 'caring',
      pauseDuration: 300
    },
    'english': {
      lang: 'en-US',
      rate: 0.9,
      pitch: 1.1,
      volume: 0.9,
      voiceNames: ['Google US English', 'Microsoft Zira', 'Microsoft David', 'Samantha', 'Karen'],
      culturalTone: 'professional',
      pauseDuration: 200
    },
    'spanish': {
      lang: 'es-ES',
      rate: 0.85,
      pitch: 1.05,
      volume: 0.9,
      voiceNames: ['Google español', 'Microsoft Helena', 'Microsoft Sabina', 'Mónica'],
      culturalTone: 'friendly',
      pauseDuration: 250
    },
    'french': {
      lang: 'fr-FR',
      rate: 0.88,
      pitch: 1.0,
      volume: 0.9,
      voiceNames: ['Google français', 'Microsoft Hortense', 'Microsoft Julie', 'Amelie'],
      culturalTone: 'formal',
      pauseDuration: 280
    },
    'german': {
      lang: 'de-DE',
      rate: 0.85,
      pitch: 0.95,
      volume: 0.9,
      voiceNames: ['Google Deutsch', 'Microsoft Hedda', 'Microsoft Stefan', 'Anna'],
      culturalTone: 'professional',
      pauseDuration: 250
    },
    'portuguese': {
      lang: 'pt-BR',
      rate: 0.87,
      pitch: 1.05,
      volume: 0.9,
      voiceNames: ['Google português do Brasil', 'Microsoft Maria', 'Luciana'],
      culturalTone: 'friendly',
      pauseDuration: 240
    },
    'japanese': {
      lang: 'ja-JP',
      rate: 0.82,
      pitch: 1.1,
      volume: 0.9,
      voiceNames: ['Google 日本語', 'Microsoft Haruka', 'Microsoft Ichiro', 'Kyoko'],
      culturalTone: 'formal',
      pauseDuration: 350
    },
    'korean': {
      lang: 'ko-KR',
      rate: 0.83,
      pitch: 1.08,
      volume: 0.9,
      voiceNames: ['Google 한국의', 'Microsoft Heami', 'Yuna'],
      culturalTone: 'caring',
      pauseDuration: 320
    },
    'chinese': {
      lang: 'zh-CN',
      rate: 0.85,
      pitch: 1.0,
      volume: 0.9,
      voiceNames: ['Google 中文（简体）', 'Microsoft Huihui', 'Microsoft Kangkang', 'Ting-Ting'],
      culturalTone: 'professional',
      pauseDuration: 300
    },
    'arabic': {
      lang: 'ar-SA',
      rate: 0.8,
      pitch: 0.98,
      volume: 0.9,
      voiceNames: ['Google العربية', 'Microsoft Naayf', 'Maged'],
      culturalTone: 'formal',
      pauseDuration: 350
    }
  };

  public static getInstance(): VoiceToneAdapter {
    if (!VoiceToneAdapter.instance) {
      VoiceToneAdapter.instance = new VoiceToneAdapter();
    }
    return VoiceToneAdapter.instance;
  }

  constructor() {
    this.initializeVoices();
    // Re-initialize when voices change (some browsers load voices asynchronously)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => this.initializeVoices();
    }
  }

  private initializeVoices(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.voices = window.speechSynthesis.getVoices();
    }
  }

  private findOptimalVoice(language: string, patientGender?: string): SpeechSynthesisVoice | null {
    const config = this.languageConfigs[language];
    if (!config || this.voices.length === 0) return null;

    // Create cache key for consistent voice selection
    const cacheKey = `${language}_${patientGender || 'default'}`;
    
    // Check if we already have a selected voice for this combination
    if (this.selectedVoices.has(cacheKey)) {
      return this.selectedVoices.get(cacheKey) || null;
    }

    // Find voices that match the language
    const languageVoices = this.voices.filter(voice => 
      voice.lang.startsWith(config.lang.split('-')[0]) || 
      config.voiceNames.some(name => voice.name.includes(name))
    );

    if (languageVoices.length === 0) {
      // Fallback to any voice that matches the language code
      const fallbackVoices = this.voices.filter(voice => 
        voice.lang.startsWith(config.lang.split('-')[0])
      );
      if (fallbackVoices.length > 0) {
        const selectedVoice = fallbackVoices[0];
        this.selectedVoices.set(cacheKey, selectedVoice);
        return selectedVoice;
      }
      return null;
    }

    // Gender-based voice selection for better patient experience
    let preferredVoice: SpeechSynthesisVoice | null = null;

    if (patientGender === 'male') {
      // Male patients get female doctor voices for comfort
      preferredVoice = languageVoices.find(voice => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('woman') ||
        this.isFemaleVoiceName(voice.name)
      ) || null;
    } else if (patientGender === 'female') {
      // Female patients get male doctor voices for authority
      preferredVoice = languageVoices.find(voice => 
        voice.name.toLowerCase().includes('male') ||
        voice.name.toLowerCase().includes('man') ||
        this.isMaleVoiceName(voice.name)
      ) || null;
    }

    // If no gender-specific voice found, use the first available quality voice
    if (!preferredVoice) {
      preferredVoice = languageVoices.find(voice => 
        config.voiceNames.some(name => voice.name.includes(name))
      ) || languageVoices[0];
    }

    // Cache the selected voice
    if (preferredVoice) {
      this.selectedVoices.set(cacheKey, preferredVoice);
    }

    return preferredVoice;
  }

  private isFemaleVoiceName(voiceName: string): boolean {
    const femaleNames = ['samantha', 'karen', 'susan', 'moira', 'zira', 'helena', 'sabina', 'julie', 'hedda', 'maria', 'haruka', 'heami', 'huihui', 'kalpana', 'lekha'];
    return femaleNames.some(name => voiceName.toLowerCase().includes(name));
  }

  private isMaleVoiceName(voiceName: string): boolean {
    const maleNames = ['alex', 'daniel', 'thomas', 'david', 'stefan', 'ichiro', 'kangkang', 'naayf', 'maged', 'hemant'];
    return maleNames.some(name => voiceName.toLowerCase().includes(name));
  }

  private adaptTextForCulture(text: string, language: string, tone: string): string {
    const config = this.languageConfigs[language];
    if (!config) return text;

    let adaptedText = text;

    // Cultural tone adaptation
    switch (config.culturalTone) {
      case 'formal':
        // Add formal markers and slower pacing
        adaptedText = text.replace(/\./g, '. ').replace(/,/g, ', ');
        break;
      case 'caring':
        // Add empathetic phrases and gentler tone
        adaptedText = text.replace(/\. /g, '. ').replace(/!/g, '.');
        break;
      case 'friendly':
        // Add warmth and conversational markers
        adaptedText = text.replace(/\./g, '. ').replace(/\?/g, '? ');
        break;
      case 'professional':
        // Clear, concise delivery
        adaptedText = text.replace(/\s+/g, ' ').trim();
        break;
    }

    // Language-specific adaptations
    if (language === 'hindi') {
      // Add natural Hindi speech patterns
      adaptedText = adaptedText.replace(/\./g, '। ').replace(/,/g, ', ');
    } else if (language === 'japanese') {
      // Add respectful pauses for Japanese
      adaptedText = adaptedText.replace(/\./g, '。 ').replace(/,/g, '、 ');
    } else if (language === 'arabic') {
      // Add Arabic speech flow
      adaptedText = adaptedText.replace(/\./g, '. ').replace(/,/g, '، ');
    }

    return adaptedText;
  }

  public async speakText(
    text: string, 
    language: string = 'english', 
    patientGender?: string,
    medicalContext: 'diagnosis' | 'prescription' | 'general' | 'emergency' = 'general'
  ): Promise<void> {
    if (!text.trim() || typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const config = this.languageConfigs[language] || this.languageConfigs['english'];
    
    // Adapt text for cultural context
    const adaptedText = this.adaptTextForCulture(text, language, medicalContext);
    
    // Clean text for speech
    const cleanText = adaptedText
      .replace(/\*\*/g, '')
      .replace(/[🌡️💊⚠️🩺•🫁❤️🤢🧠🦴🟡]/g, '')
      .replace(/\n\n/g, '. ')
      .replace(/\n/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Apply language configuration
    utterance.lang = config.lang;
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;

    // Context-specific adjustments
    switch (medicalContext) {
      case 'emergency':
        utterance.rate = Math.min(config.rate + 0.1, 1.0);
        utterance.pitch = Math.min(config.pitch + 0.1, 2.0);
        break;
      case 'diagnosis':
        utterance.rate = Math.max(config.rate - 0.05, 0.5);
        utterance.pitch = config.pitch;
        break;
      case 'prescription':
        utterance.rate = Math.max(config.rate - 0.1, 0.5);
        utterance.pitch = Math.max(config.pitch - 0.05, 0.5);
        break;
    }

    // Set optimal voice
    const optimalVoice = this.findOptimalVoice(language, patientGender);
    if (optimalVoice) {
      utterance.voice = optimalVoice;
    }

    return new Promise((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);

      // Add natural pause before speaking for better user experience
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 100);
    });
  }

  public getAvailableLanguages(): string[] {
    return Object.keys(this.languageConfigs);
  }

  public getLanguageConfig(language: string): VoiceConfig | null {
    return this.languageConfigs[language] || null;
  }

  public testVoice(language: string, patientGender?: string): void {
    const testMessages = {
      hindi: 'नमस्ते! मैं आपका AI डॉक्टर हूं। आपकी कैसे सहायता कर सकता हूं?',
      english: 'Hello! I am your AI doctor. How can I help you today?',
      spanish: '¡Hola! Soy tu médico AI. ¿Cómo puedo ayudarte hoy?',
      french: 'Bonjour! Je suis votre médecin IA. Comment puis-je vous aider aujourd\'hui?',
      german: 'Hallo! Ich bin Ihr KI-Arzt. Wie kann ich Ihnen heute helfen?',
      portuguese: 'Olá! Eu sou seu médico AI. Como posso ajudá-lo hoje?',
      japanese: 'こんにちは！私はあなたのAI医師です。今日はどのようにお手伝いできますか？',
      korean: '안녕하세요! 저는 당신의 AI 의사입니다. 오늘 어떻게 도와드릴까요?',
      chinese: '您好！我是您的AI医生。今天我能为您做些什么？',
      arabic: 'مرحبا! أنا طبيبك الذكي. كيف يمكنني مساعدتك اليوم؟'
    };

    const message = testMessages[language as keyof typeof testMessages] || testMessages.english;
    this.speakText(message, language, patientGender, 'general');
  }
}

export const voiceToneAdapter = VoiceToneAdapter.getInstance();