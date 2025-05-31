#!/usr/bin/env python3
"""
OpenAI Whisper Speech-to-Text Service
Provides accurate multilingual speech recognition for medical consultations
"""

import sys
import json
import tempfile
import os
import base64
import whisper
from pathlib import Path

class WhisperSTTService:
    def __init__(self):
        """Initialize Whisper model"""
        self.model = None
        self.model_name = "base"  # Using base model as requested
        
    def load_model(self):
        """Load Whisper model if not already loaded"""
        if self.model is None:
            print(f"Loading Whisper {self.model_name} model...", file=sys.stderr)
            try:
                self.model = whisper.load_model(self.model_name)
                print(f"Whisper {self.model_name} model loaded successfully", file=sys.stderr)
            except Exception as e:
                print(f"Error loading Whisper model: {e}", file=sys.stderr)
                raise
    
    def transcribe_audio(self, audio_data_b64, language_hint=None):
        """
        Transcribe audio from base64 encoded data
        
        Args:
            audio_data_b64: Base64 encoded audio data
            language_hint: Optional language hint (e.g., 'en', 'hi', 'bn')
        
        Returns:
            dict: Transcription result with text, language, and confidence
        """
        try:
            self.load_model()
            
            # Decode base64 audio data
            audio_data = base64.b64decode(audio_data_b64)
            
            # Create temporary file for audio
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                temp_file.write(audio_data)
                temp_audio_path = temp_file.name
            
            # Transcribe audio
            options = {
                "task": "transcribe",
                "best_of": 1,
                "beam_size": 5
            }
            
            if language_hint:
                options["language"] = language_hint
            
            result = self.model.transcribe(temp_audio_path, **options)
            
            # Clean up temporary file
            os.unlink(temp_audio_path)
            
            return {
                "success": True,
                "text": result["text"].strip(),
                "language": result.get("language", "unknown"),
                "segments": result.get("segments", []),
                "confidence": self._calculate_confidence(result)
            }
            
        except Exception as e:
            # Clean up temp file if it exists
            if 'temp_audio_path' in locals():
                try:
                    os.unlink(temp_audio_path)
                except:
                    pass
            
            return {
                "success": False,
                "error": str(e),
                "text": "",
                "language": "unknown",
                "confidence": 0.0
            }
    
    def _calculate_confidence(self, result):
        """Calculate average confidence from segments"""
        if not result.get("segments"):
            return 0.8  # Default confidence for base model
        
        confidences = []
        for segment in result["segments"]:
            if "avg_logprob" in segment:
                # Convert log probability to confidence score
                confidence = min(1.0, max(0.0, (segment["avg_logprob"] + 1.0)))
                confidences.append(confidence)
        
        return sum(confidences) / len(confidences) if confidences else 0.8

def main():
    """Main function to handle command line transcription requests"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python whisper-service.py <base64_audio_data> [language_hint]"
        }))
        sys.exit(1)
    
    audio_data_b64 = sys.argv[1]
    language_hint = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Initialize service
    service = WhisperSTTService()
    
    # Perform transcription
    result = service.transcribe_audio(audio_data_b64, language_hint)
    
    # Output result as JSON
    print(json.dumps(result))

if __name__ == "__main__":
    main()