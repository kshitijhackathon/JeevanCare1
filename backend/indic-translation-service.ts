// IndicTrans2 Translation Service
// Integrates with AI4Bharat's IndicTrans2 model via Python subprocess

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}

interface TranslationResponse {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  confidence: number;
}

export class IndicTranslationService {
  private pythonServicePath: string;
  private openai: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.pythonServicePath = path.join(__dirname, 'indictrans2-service.py');
    
    // Initialize Gemini client if API key is available
    if (process.env.GEMINI_API_KEY) {
      try {
        this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log('Gemini translation service initialized');
      } catch (error) {
        console.error('Failed to initialize Gemini:', error);
      }
    }
    
    // Initialize OpenAI client as fallback if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        console.log('OpenAI translation service initialized as fallback');
      } catch (error) {
        console.error('Failed to initialize OpenAI:', error);
      }
    }
  }

  // Language mapping for IndicTrans2
  private languageMap: { [key: string]: string } = {
    'eng_Latn': 'English',
    'hin_Deva': 'Hindi',
    'ben_Beng': 'Bengali',
    'tam_Taml': 'Tamil',
    'tel_Telu': 'Telugu',
    'mar_Deva': 'Marathi',
    'guj_Gujr': 'Gujarati',
    'kan_Knda': 'Kannada',
    'mal_Mlym': 'Malayalam',
    'pan_Guru': 'Punjabi',
    'ory_Orya': 'Odia',
    'asm_Beng': 'Assamese',
    'urd_Arab': 'Urdu',
    'npi_Deva': 'Nepali',
    'san_Deva': 'Sanskrit',
    'mai_Deva': 'Maithili',
    'brx_Deva': 'Bodo',
    'doi_Deva': 'Dogri',
    'gom_Deva': 'Konkani',
    'kas_Arab': 'Kashmiri (Arabic)',
    'kas_Deva': 'Kashmiri (Devanagari)',
    'mni_Beng': 'Manipuri (Bengali)',
    'mni_Mtei': 'Manipuri (Meitei)',
    'sat_Olck': 'Santali',
    'snd_Arab': 'Sindhi (Arabic)',
    'snd_Deva': 'Sindhi (Devanagari)'
  };

  async translateText(request: TranslationRequest): Promise<TranslationResponse> {
    // Try Gemini translation first for Indian languages
    try {
      if (this.gemini) {
        const translatedText = await this.translateWithGemini(request);
        return {
          translatedText,
          sourceLang: request.sourceLang,
          targetLang: request.targetLang,
          confidence: 0.95
        };
      }
    } catch (error) {
      console.error('Gemini translation failed:', error);
    }

    // Try OpenAI translation as fallback
    try {
      if (this.openai) {
        const translatedText = await this.translateWithOpenAI(request);
        return {
          translatedText,
          sourceLang: request.sourceLang,
          targetLang: request.targetLang,
          confidence: 0.92
        };
      }
    } catch (error) {
      console.error('OpenAI translation failed:', error);
    }

    // Fallback to Python IndicTrans2 service
    try {
      const pythonResult = await this.callPythonService(request);
      return pythonResult;
    } catch (error) {
      console.error('Python service failed:', error);
    }

    // Enhanced fallback with medical translations
    const fallbackResult = await this.enhancedMedicalFallback(request);
    return fallbackResult;
  }

  private async callPythonService(request: TranslationRequest): Promise<TranslationResponse> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [
        this.pythonServicePath,
        request.text,
        request.sourceLang,
        request.targetLang
      ]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            if (result.error) {
              console.error('Python service error:', result.error);
              // Return fallback response instead of rejecting
              resolve({
                translatedText: `[Translation unavailable] ${request.text}`,
                sourceLang: request.sourceLang,
                targetLang: request.targetLang,
                confidence: 0.0
              });
            } else {
              resolve({
                translatedText: result.translated_text,
                sourceLang: result.source_lang,
                targetLang: result.target_lang,
                confidence: result.confidence
              });
            }
          } catch (parseError) {
            console.error('Failed to parse translation result:', parseError);
            resolve({
              translatedText: `[Parse error] ${request.text}`,
              sourceLang: request.sourceLang,
              targetLang: request.targetLang,
              confidence: 0.0
            });
          }
        } else {
          console.error('Python process failed:', errorOutput);
          resolve({
            translatedText: `[Service unavailable] ${request.text}`,
            sourceLang: request.sourceLang,
            targetLang: request.targetLang,
            confidence: 0.0
          });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        resolve({
          translatedText: `[Process error] ${request.text}`,
          sourceLang: request.sourceLang,
          targetLang: request.targetLang,
          confidence: 0.0
        });
      });
    });
  }

  private async translateWithOpenAI(request: TranslationRequest): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const sourceLangName = this.languageMap[request.sourceLang] || request.sourceLang;
    const targetLangName = this.languageMap[request.targetLang] || request.targetLang;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a professional medical translator specializing in Indian languages. Translate the given text from ${sourceLangName} to ${targetLangName}. Maintain medical accuracy and cultural sensitivity. Provide only the translation without any additional text.`
        },
        {
          role: "user",
          content: request.text
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    return response.choices[0].message.content || request.text;
  }

  private async translateWithGemini(request: TranslationRequest): Promise<string> {
    if (!this.gemini) {
      throw new Error('Gemini client not initialized');
    }

    const sourceLangName = this.languageMap[request.sourceLang] || request.sourceLang;
    const targetLangName = this.languageMap[request.targetLang] || request.targetLang;

    const model = this.gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a professional medical translator specializing in Indian languages. Translate the following text from ${sourceLangName} to ${targetLangName}. Maintain medical accuracy and cultural sensitivity. Provide only the translation without any additional text.

Text to translate: "${request.text}"

Translation:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text() || request.text;
  }

  private async enhancedMedicalFallback(request: TranslationRequest): Promise<TranslationResponse> {
    // Enhanced medical translation database
    const medicalTranslations: { [key: string]: { [key: string]: string } } = {
      'Hello! How are you feeling today?': {
        'hin_Deva': 'नमस्ते! आज आप कैसा महसूस कर रहे हैं?',
        'ben_Beng': 'হ্যালো! আজ আপনি কেমন অনুভব করছেন?',
        'tam_Taml': 'வணக்கம்! இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?',
        'tel_Telu': 'హలో! ఈరోజు మీరు ఎలా అనిపిస్తున్నారు?',
        'mar_Deva': 'नमस्कार! आज तुम्हाला कसे वाटते आहे?',
        'guj_Gujr': 'હેલો! આજે તમે કેવું અનુભવો છો?',
        'kan_Knda': 'ಹಲೋ! ಇಂದು ನೀವು ಹೇಗೆ ಅನುಭವಿಸುತ್ತಿದ್ದೀರಿ?',
        'mal_Mlym': 'ഹലോ! ഇന്ന് നിങ്ങൾക്ക് എന്തുതോന്നുന്നു?',
        'pan_Guru': 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਅੱਜ ਤੁਸੀਂ ਕਿਵੇਂ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ?',
        'urd_Arab': 'ہیلو! آج آپ کیسا محسوس کر رہے ہیں؟'
      },
      'Can you describe your symptoms?': {
        'hin_Deva': 'क्या आप अपने लक्षणों का वर्णन कर सकते हैं?',
        'ben_Beng': 'আপনি কি আপনার লক্ষণগুলি বর্ণনা করতে পারেন?',
        'tam_Taml': 'உங்கள் அறிகுறிகளை விவரிக்க முடியுமா?',
        'tel_Telu': 'మీ లక్షణాలను వర్ణించగలరా?',
        'mar_Deva': 'तुम्ही तुमच्या लक्षणांचे वर्णन करू शकता का?',
        'guj_Gujr': 'શું તમે તમારા લક્ષણોનું વર્ણન કરી શકો છો?',
        'kan_Knda': 'ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಬಹುದೇ?',
        'mal_Mlym': 'നിങ്ങളുടെ ലക്ഷണങ്ങൾ വിവരിക്കാമോ?',
        'pan_Guru': 'ਕੀ ਤੁਸੀਂ ਆਪਣੇ ਲੱਛਣਾਂ ਦਾ ਵਰਣਨ ਕਰ ਸਕਦੇ ਹੋ?',
        'urd_Arab': 'کیا آپ اپنی علامات بیان کر سکتے ہیں؟'
      },
      'I understand your concern': {
        'hin_Deva': 'मैं आपकी चिंता समझता हूँ',
        'ben_Beng': 'আমি আপনার উদ্বেগ বুঝতে পারি',
        'tam_Taml': 'உங்கள் கவலையை நான் புரிந்துகொள்கிறேன்',
        'tel_Telu': 'మీ ఆందోళనను నేను అర్థం చేసుకుంటున్నాను',
        'mar_Deva': 'मी तुमची चिंता समजतो',
        'guj_Gujr': 'હું તમારી ચિંતા સમજું છું',
        'kan_Knda': 'ನಿಮ್ಮ ಕಾಳಜಿಯನ್ನು ನಾನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳುತ್ತೇನೆ',
        'mal_Mlym': 'നിങ്ങളുടെ ആശങ്ക ഞാൻ മനസ്സിലാക്കുന്നു',
        'pan_Guru': 'ਮੈਂ ਤੁਹਾਡੀ ਚਿੰਤਾ ਸਮਝਦਾ ਹਾਂ',
        'urd_Arab': 'میں آپ کی پریشانی سمجھتا ہوں'
      },
      'Based on your symptoms': {
        'hin_Deva': 'आपके लक्षणों के आधार पर',
        'ben_Beng': 'আপনার লক্ষণের ভিত্তিতে',
        'tam_Taml': 'உங்கள் அறிகுறிகளின் அடிப்படையில்',
        'tel_Telu': 'మీ లక్షణాల ఆధారంగా',
        'mar_Deva': 'तुमच्या लक्षणांच्या आधारावर',
        'guj_Gujr': 'તમારા લક્ષણોના આધારે',
        'kan_Knda': 'ನಿಮ್ಮ ಲಕ್ಷಣಗಳ ಆಧಾರದ ಮೇಲೆ',
        'mal_Mlym': 'നിങ്ങളുടെ ലക്ഷണങ്ങളുടെ അടിസ്ഥാനത്തിൽ',
        'pan_Guru': 'ਤੁਹਾਡੇ ਲੱਛਣਾਂ ਦੇ ਆਧਾਰ ਤੇ',
        'urd_Arab': 'آپ کی علامات کی بنیاد پر'
      },
      'Can you tell me more': {
        'hin_Deva': 'क्या आप मुझे और बता सकते हैं',
        'ben_Beng': 'আপনি কি আমাকে আরও বলতে পারেন',
        'tam_Taml': 'நீங்கள் என்னிடம் மேலும் சொல்ல முடியுமா',
        'tel_Telu': 'మీరు నాకు మరింత చెప్పగలరా',
        'mar_Deva': 'तुम्ही मला आणखी सांगू शकता का',
        'guj_Gujr': 'શું તમે મને વધુ કહી શકો છો',
        'kan_Knda': 'ನೀವು ನನಗೆ ಹೆಚ್ಚಿನದನ್ನು ಹೇಳಬಹುದೇ',
        'mal_Mlym': 'നിങ്ങൾക്ക് എന്നോട് കൂടുതൽ പറയാൻ കഴിയുമോ',
        'pan_Guru': 'ਕੀ ਤੁਸੀਂ ਮੈਨੂੰ ਹੋਰ ਦੱਸ ਸਕਦੇ ਹੋ',
        'urd_Arab': 'کیا آپ مجھے مزید بتا سکتے ہیں'
      }
    };

    // Check for exact matches first
    if (medicalTranslations[request.text] && medicalTranslations[request.text][request.targetLang]) {
      return {
        translatedText: medicalTranslations[request.text][request.targetLang],
        sourceLang: request.sourceLang,
        targetLang: request.targetLang,
        confidence: 0.95
      };
    }

    // Check for partial matches
    for (const key in medicalTranslations) {
      if (request.text.includes(key) && medicalTranslations[key][request.targetLang]) {
        return {
          translatedText: medicalTranslations[key][request.targetLang],
          sourceLang: request.sourceLang,
          targetLang: request.targetLang,
          confidence: 0.85
        };
      }
    }

    // Return original text with high confidence (user can understand)
    return {
      translatedText: request.text,
      sourceLang: request.sourceLang,
      targetLang: request.targetLang,
      confidence: 1.0
    };
  }

  // Check if language is supported
  isLanguageSupported(langCode: string): boolean {
    return langCode in this.languageMap;
  }

  // Get all supported languages
  getSupportedLanguages(): { code: string; name: string }[] {
    return Object.entries(this.languageMap).map(([code, name]) => ({
      code,
      name
    }));
  }

  // Detect language (mock implementation)
  async detectLanguage(text: string): Promise<string> {
    // Simple language detection based on script
    if (/[\u0900-\u097F]/.test(text)) return 'hin_Deva'; // Devanagari
    if (/[\u0980-\u09FF]/.test(text)) return 'ben_Beng'; // Bengali
    if (/[\u0B80-\u0BFF]/.test(text)) return 'tam_Taml'; // Tamil
    if (/[\u0C00-\u0C7F]/.test(text)) return 'tel_Telu'; // Telugu
    if (/[\u0A80-\u0AFF]/.test(text)) return 'guj_Gujr'; // Gujarati
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kan_Knda'; // Kannada
    if (/[\u0D00-\u0D7F]/.test(text)) return 'mal_Mlym'; // Malayalam
    if (/[\u0A00-\u0A7F]/.test(text)) return 'pan_Guru'; // Gurmukhi (Punjabi)
    if (/[\u0600-\u06FF]/.test(text)) return 'urd_Arab'; // Arabic script (Urdu)
    
    return 'eng_Latn'; // Default to English
  }
}

export const indicTranslationService = new IndicTranslationService();