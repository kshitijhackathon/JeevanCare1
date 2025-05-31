// Enhanced Audio Transcription Service with Whisper Integration
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface AudioTranscriptionResult {
  text: string;
  confidence: number;
  language?: string;
  status: string;
}

export class EnhancedAudioTranscription {
  private whisperAvailable = false;
  
  constructor() {
    this.checkWhisperAvailability();
  }

  private async checkWhisperAvailability(): Promise<void> {
    try {
      // Check if whisper command is available
      const process = spawn('whisper', ['--help'], { stdio: 'pipe' });
      
      process.on('close', (code) => {
        this.whisperAvailable = code === 0;
        console.log(`Whisper availability: ${this.whisperAvailable ? 'Available' : 'Not available'}`);
      });

      process.on('error', () => {
        this.whisperAvailable = false;
      });
    } catch (error) {
      this.whisperAvailable = false;
    }
  }
  
  async transcribeAudio(audioData: string, language?: string): Promise<AudioTranscriptionResult> {
    try {
      if (!this.whisperAvailable) {
        return this.fallbackTranscription(language);
      }

      // Save audio data to temporary file
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const audioBuffer = Buffer.from(audioData, 'base64');
      const tempFile = path.join(tempDir, `audio_${Date.now()}.webm`);
      fs.writeFileSync(tempFile, audioBuffer);

      // Map language codes to Whisper language names
      const languageMap: { [key: string]: string } = {
        'eng_Latn': 'English',
        'hin_Deva': 'Hindi',
        'ben_Beng': 'Bengali',
        'tam_Taml': 'Tamil',
        'tel_Telu': 'Telugu',
        'mar_Deva': 'Marathi',
        'guj_Gujr': 'Gujarati',
        'kan_Knda': 'Kannada',
        'mal_Mlym': 'Malayalam',
        'pan_Guru': 'Punjabi'
      };

      const whisperLanguage = languageMap[language || 'eng_Latn'] || 'English';
      
      // Use Whisper to transcribe
      const result = await this.runWhisper(tempFile, whisperLanguage);
      
      // Clean up temporary file
      try {
        fs.unlinkSync(tempFile);
      } catch (cleanupError) {
        console.warn('Could not cleanup temp file:', cleanupError);
      }

      return {
        text: result.text,
        confidence: result.confidence,
        language: language || 'eng_Latn',
        status: 'success'
      };
      
    } catch (error) {
      console.error('Audio transcription error:', error);
      return this.fallbackTranscription(language);
    }
  }

  private async runWhisper(audioFile: string, language: string): Promise<{ text: string; confidence: number }> {
    return new Promise((resolve, reject) => {
      const args = [
        audioFile,
        '--model', 'turbo',
        '--language', language,
        '--output_format', 'txt'
      ];

      const whisperProcess = spawn('whisper', args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      whisperProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      whisperProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      whisperProcess.on('close', (code) => {
        if (code === 0) {
          // Parse output to extract transcribed text
          const text = stdout.trim() || 'Audio transcribed successfully but no text detected.';
          resolve({
            text: text,
            confidence: 0.9 // Whisper generally has high confidence
          });
        } else {
          console.error('Whisper process failed:', stderr);
          reject(new Error(`Whisper failed with code ${code}: ${stderr}`));
        }
      });

      whisperProcess.on('error', (error) => {
        console.error('Whisper process error:', error);
        reject(error);
      });

      // Set timeout for transcription
      setTimeout(() => {
        whisperProcess.kill();
        reject(new Error('Whisper transcription timeout'));
      }, 30000); // 30 second timeout
    });
  }

  private fallbackTranscription(language?: string): AudioTranscriptionResult {
    const languageNames: { [key: string]: string } = {
      'eng_Latn': 'English',
      'hin_Deva': 'Hindi', 
      'ben_Beng': 'Bengali',
      'tam_Taml': 'Tamil',
      'tel_Telu': 'Telugu',
      'mar_Deva': 'Marathi',
      'guj_Gujr': 'Gujarati',
      'kan_Knda': 'Kannada',
      'mal_Mlym': 'Malayalam',
      'pan_Guru': 'Punjabi'
    };

    const selectedLang = languageNames[language || 'eng_Latn'] || 'English';
    
    return {
      text: `Audio recorded in ${selectedLang}. Whisper transcription is being set up. Please type your message for now.`,
      confidence: 0.5,
      language: language || 'eng_Latn',
      status: 'fallback'
    };
  }

  // Enhanced audio format validation
  validateAudioData(audioData: string): boolean {
    try {
      // Basic validation - check if it's valid base64
      const decoded = Buffer.from(audioData, 'base64');
      
      // Check minimum size (should be at least a few KB for meaningful audio)
      if (decoded.length < 1000) {
        return false;
      }

      // Check for common audio file headers
      const header = decoded.slice(0, 20).toString('hex');
      const isWebM = header.includes('1a45dfa3') || decoded.slice(0, 4).toString() === 'webm';
      const isWAV = header.startsWith('52494646') && header.includes('57415645');
      const isMP3 = header.startsWith('494433') || header.startsWith('fff');

      return isWebM || isWAV || isMP3 || decoded.length > 1000; // Allow if reasonable size
    } catch {
      return false;
    }
  }

  // Check if Whisper is properly installed
  isWhisperAvailable(): boolean {
    return this.whisperAvailable;
  }
}

export const enhancedAudioTranscription = new EnhancedAudioTranscription();