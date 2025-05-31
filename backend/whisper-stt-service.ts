// Enhanced Speech-to-Text Service using OpenAI Whisper
// Provides accurate multilingual speech recognition for medical consultations

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

interface STTRequest {
  audioData: string; // Base64 encoded audio
  languageHint?: string; // Optional language hint
}

interface STTResponse {
  success: boolean;
  text: string;
  language: string;
  confidence: number;
  error?: string;
}

export class WhisperSTTService {
  private pythonServicePath: string;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.pythonServicePath = path.join(__dirname, 'whisper-service.py');
  }

  // Language code mapping for Whisper
  private getWhisperLanguageCode(languageCode: string): string {
    const languageMap: { [key: string]: string } = {
      'eng_Latn': 'en',
      'hin_Deva': 'hi',
      'ben_Beng': 'bn',
      'tam_Taml': 'ta',
      'tel_Telu': 'te',
      'mar_Deva': 'mr',
      'guj_Gujr': 'gu',
      'kan_Knda': 'kn',
      'mal_Mlym': 'ml',
      'pan_Guru': 'pa',
      'urd_Arab': 'ur',
      'ori_Orya': 'or',
      'asm_Beng': 'as',
      'kok_Deva': 'en', // Konkani fallback to English
      'mai_Deva': 'hi', // Maithili fallback to Hindi
      'bho_Deva': 'hi', // Bhojpuri fallback to Hindi
      'sat_Olck': 'en', // Santali fallback to English
      'doi_Deva': 'hi', // Dogri fallback to Hindi
      'kas_Arab': 'ur', // Kashmiri fallback to Urdu
      'kas_Deva': 'hi', // Kashmiri Devanagari fallback to Hindi
      'mni_Beng': 'bn', // Manipuri Bengali fallback to Bengali
      'mni_Mtei': 'en', // Manipuri Meitei fallback to English
      'snd_Arab': 'ur', // Sindhi Arabic fallback to Urdu
      'snd_Deva': 'hi', // Sindhi Devanagari fallback to Hindi
      'brx_Deva': 'hi', // Bodo fallback to Hindi
      'gom_Deva': 'hi'  // Konkani Devanagari fallback to Hindi
    };

    return languageMap[languageCode] || 'en';
  }

  async transcribeAudio(request: STTRequest): Promise<STTResponse> {
    try {
      const whisperLangCode = request.languageHint ? 
        this.getWhisperLanguageCode(request.languageHint) : undefined;

      const result = await this.callWhisperService(request.audioData, whisperLangCode);
      return result;
    } catch (error) {
      console.error('Whisper STT failed:', error);
      return {
        success: false,
        text: '',
        language: 'unknown',
        confidence: 0.0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async callWhisperService(audioData: string, languageHint?: string): Promise<STTResponse> {
    return new Promise((resolve) => {
      const args = [this.pythonServicePath, audioData];
      if (languageHint) {
        args.push(languageHint);
      }

      const pythonProcess = spawn('python3', args);

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
            resolve({
              success: result.success || false,
              text: result.text || '',
              language: result.language || 'unknown',
              confidence: result.confidence || 0.0,
              error: result.error
            });
          } catch (parseError) {
            console.error('Failed to parse Whisper result:', parseError);
            resolve({
              success: false,
              text: '',
              language: 'unknown',
              confidence: 0.0,
              error: 'Failed to parse transcription result'
            });
          }
        } else {
          console.error('Whisper process failed:', errorOutput);
          resolve({
            success: false,
            text: '',
            language: 'unknown',
            confidence: 0.0,
            error: 'Whisper service unavailable'
          });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start Whisper process:', error);
        resolve({
          success: false,
          text: '',
          language: 'unknown',
          confidence: 0.0,
          error: 'Failed to start transcription service'
        });
      });
    });
  }

  // Check if Whisper is available
  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.callWhisperService('', 'en');
      return result.success || result.error !== 'Failed to start transcription service';
    } catch {
      return false;
    }
  }

  // Get supported languages
  getSupportedLanguages(): { code: string; name: string; whisperCode: string }[] {
    return [
      { code: 'eng_Latn', name: 'English', whisperCode: 'en' },
      { code: 'hin_Deva', name: 'Hindi', whisperCode: 'hi' },
      { code: 'ben_Beng', name: 'Bengali', whisperCode: 'bn' },
      { code: 'tam_Taml', name: 'Tamil', whisperCode: 'ta' },
      { code: 'tel_Telu', name: 'Telugu', whisperCode: 'te' },
      { code: 'mar_Deva', name: 'Marathi', whisperCode: 'mr' },
      { code: 'guj_Gujr', name: 'Gujarati', whisperCode: 'gu' },
      { code: 'kan_Knda', name: 'Kannada', whisperCode: 'kn' },
      { code: 'mal_Mlym', name: 'Malayalam', whisperCode: 'ml' },
      { code: 'pan_Guru', name: 'Punjabi', whisperCode: 'pa' },
      { code: 'urd_Arab', name: 'Urdu', whisperCode: 'ur' },
      { code: 'ori_Orya', name: 'Odia', whisperCode: 'or' },
      { code: 'asm_Beng', name: 'Assamese', whisperCode: 'as' }
    ];
  }
}

// Create singleton instance
export const whisperSTTService = new WhisperSTTService();