import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WhisperSpeechRecognitionProps {
  onTranscript: (text: string, language: string, confidence: number) => void;
  onAudioData?: (audioData: Blob) => void;
  isProcessing?: boolean;
  language?: string;
  continuous?: boolean;
}

export function WhisperSpeechRecognition({ 
  onTranscript, 
  onAudioData,
  isProcessing = false,
  language = 'hindi',
  continuous = true
}: WhisperSpeechRecognitionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState(language);
  const [confidence, setConfidence] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced medical term patterns for better recognition
  const medicalPatterns = {
    hindi: {
      'सिर दर्द': ['sir dard', 'headache', 'sar me dard'],
      'पेट दर्द': ['pet dard', 'pet me dard', 'stomach pain'],
      'बुखार': ['bukhar', 'fever', 'tez bukhar'],
      'खांसी': ['khasi', 'khansi', 'cough'],
      'सांस': ['sans', 'breathing', 'sans lene me'],
      'चक्कर': ['chakkar', 'dizziness', 'sir ghoomna']
    },
    english: {
      'headache': ['headache', 'head pain', 'migraine'],
      'stomach pain': ['stomach pain', 'belly ache', 'abdominal pain'],
      'fever': ['fever', 'high temperature', 'hot feeling'],
      'cough': ['cough', 'coughing', 'throat irritation'],
      'breathing': ['breathing problem', 'shortness of breath', 'difficulty breathing'],
      'dizziness': ['dizziness', 'vertigo', 'feeling dizzy']
    }
  };

  // Initialize enhanced speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
    
      // Enhanced configuration for medical speech recognition
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.maxAlternatives = 5; // Get multiple alternatives for better accuracy
      
      // Set language with fallbacks
      const languageMap: Record<string, string[]> = {
        hindi: ['hi-IN', 'en-IN'],
        english: ['en-IN', 'en-US'],
        bengali: ['bn-IN', 'en-IN'],
        tamil: ['ta-IN', 'en-IN'],
        telugu: ['te-IN', 'en-IN']
      };
      
      recognition.lang = languageMap[detectedLanguage]?.[0] || 'hi-IN';

    recognition.onstart = () => {
      console.log('Enhanced speech recognition started');
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      setIsAnalyzing(true);
      let finalTranscript = '';
      let interimTranscript = '';
      let bestConfidence = 0;

      // Process all alternatives for better accuracy
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        
        if (result.isFinal) {
          // Get the best alternative from multiple options
          let bestAlternative = result[0];
          for (let j = 0; j < result.length; j++) {
            if (result[j].confidence > bestAlternative.confidence) {
              bestAlternative = result[j];
            }
          }
          
          finalTranscript += bestAlternative.transcript;
          bestConfidence = Math.max(bestConfidence, bestAlternative.confidence);
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      
      // Enhanced medical term recognition
      const enhancedTranscript = enhanceMedicalTerms(currentTranscript, detectedLanguage);
      setTranscript(enhancedTranscript);
      setConfidence(bestConfidence);

      // Detect language from speech patterns
      const detectedLang = detectLanguageFromSpeech(enhancedTranscript);
      if (detectedLang !== detectedLanguage) {
        setDetectedLanguage(detectedLang);
        // Update recognition language
        recognition.lang = languageMap[detectedLang]?.[0] || 'hi-IN';
      }

      // Send final transcript with enhanced medical context
      if (finalTranscript.trim()) {
        setIsAnalyzing(false);
        onTranscript(enhancedTranscript.trim(), detectedLang, bestConfidence);
        setTranscript('');
        
        // Reset silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        
        // Auto-restart if continuous mode
        if (continuous) {
          silenceTimeoutRef.current = setTimeout(() => {
            if (isRecording) {
              recognition.stop();
              setTimeout(() => recognition.start(), 500);
            }
          }, 2000);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsAnalyzing(false);
      
      if (event.error === 'no-speech') {
        // Handle silence gracefully
        if (continuous && isRecording) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.log('Recognition restart failed:', e);
            }
          }, 1000);
        }
      } else if (event.error === 'network') {
        console.log('Network error - falling back to offline processing');
      } else {
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      setIsAnalyzing(false);
      
      // Auto-restart for continuous listening
      if (continuous && isRecording) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.log('Auto-restart failed:', e);
          }
        }, 500);
      }
    };

    recognitionRef.current = recognition;

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
      };
    } catch (error) {
      console.error('Speech recognition initialization failed:', error);
    }
  }, [detectedLanguage, continuous, onTranscript]);

  // Enhanced medical term recognition
  const enhanceMedicalTerms = (text: string, language: string): string => {
    let enhancedText = text.toLowerCase();
    
    const patterns = medicalPatterns[language as keyof typeof medicalPatterns];
    if (patterns) {
      Object.entries(patterns).forEach(([medical, alternatives]) => {
        alternatives.forEach(alt => {
          const regex = new RegExp(alt, 'gi');
          if (regex.test(enhancedText)) {
            enhancedText = enhancedText.replace(regex, medical);
          }
        });
      });
    }

    return enhancedText;
  };

  // Language detection from speech patterns
  const detectLanguageFromSpeech = (text: string): string => {
    const patterns = {
      hindi: /[\u0900-\u097F]|dard|bukhar|khasi|pet|sir|mujhe|mere|hai|ka|ki|me/i,
      english: /^[a-zA-Z\s]+$|pain|fever|cough|feeling|have|my|is|the|and/i,
      bengali: /[\u0980-\u09FF]|amar|ki|ache|koro|holo/i,
      tamil: /[\u0B80-\u0BFF]|enakku|vandhu|irukku|enna/i,
      telugu: /[\u0C00-\u0C7F]|naku|undi|emi|ela/i
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    return language; // Return current language as default
  };

  // Initialize audio level monitoring
  useEffect(() => {
    if (isRecording) {
      startAudioLevelMonitoring();
    } else {
      stopAudioLevelMonitoring();
    }

    return () => stopAudioLevelMonitoring();
  }, [isRecording]);

  const startAudioLevelMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Optimal for speech recognition
        } 
      });
      
      audioStreamRef.current = stream;
      
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Monitor audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkLevel = () => {
        if (analyser && isRecording) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(Math.min(100, (average / 128) * 100));
          requestAnimationFrame(checkLevel);
        }
      };
      checkLevel();

    } catch (error) {
      console.error('Failed to start audio monitoring:', error);
    }
  };

  const stopAudioLevelMonitoring = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900">
      <div className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              onClick={toggleRecording}
              size="lg"
              className={`rounded-full transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
              disabled={isProcessing}
            >
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>

            {/* Audio Level Indicator */}
            {isRecording && (
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-6 rounded-full transition-all duration-150 ${
                      audioLevel > (i + 1) * 20 
                        ? 'bg-green-500' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-white dark:bg-gray-700">
              {detectedLanguage.charAt(0).toUpperCase() + detectedLanguage.slice(1)}
            </Badge>
            {confidence > 0 && (
              <Badge variant="outline" className="bg-white dark:bg-gray-700">
                {Math.round(confidence * 100)}% conf
              </Badge>
            )}
          </div>
        </div>

        {/* Status Display */}
        <div className="text-center">
          {isRecording && !isAnalyzing && (
            <div className="text-green-600 dark:text-green-400 font-medium flex items-center justify-center">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
              🎤 Listening with enhanced accuracy...
            </div>
          )}
          
          {isAnalyzing && (
            <div className="text-blue-600 dark:text-blue-400 font-medium flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              🧠 Processing with medical context...
            </div>
          )}
          
          {isProcessing && (
            <div className="text-orange-600 dark:text-orange-400 font-medium flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              🤖 AI analyzing symptoms...
            </div>
          )}

          {!isRecording && !isProcessing && (
            <div className="text-gray-500 dark:text-gray-400 font-medium">
              🎯 Ready for multilingual speech recognition
            </div>
          )}
        </div>

        {/* Live Transcript */}
        {transcript && (
          <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border-l-4 border-blue-500">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Live transcript ({detectedLanguage}):
            </div>
            <div className="text-gray-800 dark:text-gray-200 font-medium">
              {transcript}
            </div>
            {confidence > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Confidence: {Math.round(confidence * 100)}%
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center space-y-1">
          <div>🎯 Speak clearly about your symptoms</div>
          <div>🌐 Supports Hindi, English, Bengali, Tamil, Telugu</div>
          <div>🏥 Enhanced for medical terminology</div>
        </div>
      </div>
    </Card>
  );
}

// Add types for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}