#!/usr/bin/env python3
"""
Local OpenAI Whisper Service
Provides offline speech-to-text transcription without API keys
"""

import sys
import json
import os
import tempfile
import base64
import whisper
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore")

class LocalWhisperService:
    def __init__(self):
        """Initialize Whisper model"""
        try:
            # Use base model for balance of speed and accuracy
            self.model = whisper.load_model("base")
            print(json.dumps({"status": "initialized", "model": "base"}))
        except Exception as e:
            print(json.dumps({"error": f"Model loading failed: {str(e)}"}))
            sys.exit(1)
    
    def transcribe_audio(self, audio_data, language=None):
        """
        Transcribe audio data to text
        
        Args:
            audio_data: Base64 encoded audio data
            language: Optional language code (e.g., 'hi', 'en')
        
        Returns:
            dict: Transcription result with text and confidence
        """
        try:
            # Decode base64 audio data
            audio_bytes = base64.b64decode(audio_data)
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_file:
                temp_file.write(audio_bytes)
                temp_audio_path = temp_file.name
            
            # Transcribe with Whisper
            options = {
                "fp16": False,  # Use fp32 for better compatibility
                "language": language if language else None,
                "task": "transcribe"
            }
            
            result = self.model.transcribe(temp_audio_path, **options)
            
            # Clean up temporary file
            os.unlink(temp_audio_path)
            
            # Extract text and confidence
            text = result["text"].strip()
            
            # Calculate average confidence from segments
            segments = result.get("segments", [])
            if segments:
                avg_confidence = sum(seg.get("no_speech_prob", 0.0) for seg in segments) / len(segments)
                confidence = 1.0 - avg_confidence  # Convert no_speech_prob to confidence
            else:
                confidence = 0.8  # Default confidence
            
            return {
                "text": text,
                "confidence": confidence,
                "language": result.get("language", "unknown"),
                "status": "success"
            }
            
        except Exception as e:
            return {
                "error": f"Transcription failed: {str(e)}",
                "status": "error"
            }

def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python local-whisper-service.py <base64_audio_data> [language]"}))
        sys.exit(1)
    
    # Initialize service
    service = LocalWhisperService()
    
    # Get arguments
    audio_data = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Map common language codes
    language_map = {
        'hin_Deva': 'hi',
        'eng_Latn': 'en',
        'ben_Beng': 'bn',
        'tam_Taml': 'ta',
        'tel_Telu': 'te',
        'mar_Deva': 'mr',
        'guj_Gujr': 'gu',
        'kan_Knda': 'kn',
        'mal_Mlym': 'ml',
        'pan_Guru': 'pa',
        'urd_Arab': 'ur'
    }
    
    if language and language in language_map:
        language = language_map[language]
    
    # Transcribe audio
    result = service.transcribe_audio(audio_data, language)
    
    # Output JSON result
    print(json.dumps(result))

if __name__ == "__main__":
    main()