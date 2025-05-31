// IndicTrans2 Translation Service
// Integrates with AI4Bharat's IndicTrans2 model via Python subprocess

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

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

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.pythonServicePath = path.join(__dirname, 'indictrans2-service.py');
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

  private async mockTranslate(request: TranslationRequest): Promise<string> {
    // Mock translations for common medical phrases
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
      }
    };

    // Check if we have a mock translation
    if (medicalTranslations[request.text] && medicalTranslations[request.text][request.targetLang]) {
      return medicalTranslations[request.text][request.targetLang];
    }

    // If no mock translation, return original text with language indicator
    const langName = this.languageMap[request.targetLang] || request.targetLang;
    return `[${langName}] ${request.text}`;
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