import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, Languages, Activity, Stethoscope } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface VoiceHealthCompanionProps {
  onSymptomDetected?: (symptoms: string[], language: string) => void;
  onMedicalResponse?: (response: any) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'hi-IN', name: 'हिंदी (Hindi)', flag: '🇮🇳' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
  { code: 'ar-SA', name: 'العربية', flag: '🇸🇦' }
];

export default function VoiceHealthCompanion({ 
  onSymptomDetected, 
  onMedicalResponse 
}: VoiceHealthCompanionProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedSymptoms, setDetectedSymptoms] = useState<string[]>([]);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        
        if (recognitionRef.current) {
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = selectedLanguage;

          recognitionRef.current.onstart = () => {
            setIsListening(true);
            console.log('Voice recognition started');
          };

          recognitionRef.current.onend = () => {
            setIsListening(false);
            console.log('Voice recognition ended');
          };

          recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const result = event.results[i];
              if (result.isFinal) {
                finalTranscript += result[0].transcript;
              } else {
                interimTranscript += result[0].transcript;
              }
            }

            setTranscript(finalTranscript + interimTranscript);

            // Process final transcript
            if (finalTranscript.trim()) {
              processVoiceInput(finalTranscript.trim());
            }
          };

          recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            toast({
              title: "Voice Recognition Error",
              description: "Please check your microphone permissions and try again.",
              variant: "destructive"
            });
          };
        }
      } else {
        toast({
          title: "Voice Recognition Not Supported",
          description: "Your browser doesn't support voice recognition.",
          variant: "destructive"
        });
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [selectedLanguage]);

  // Process voice input for medical analysis
  const processVoiceInput = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    
    try {
      // Extract symptoms and get medical response
      const response = await fetch('/api/ai-doctor/voice-consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          language: selectedLanguage,
          patientDetails: {
            name: 'Voice Patient',
            age: '30',
            gender: 'Unknown'
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process voice input');
      }

      const data = await response.json();
      
      setDetectedSymptoms(data.symptoms || []);
      setLastResponse(data);
      
      // Callback to parent component
      if (onSymptomDetected && data.symptoms?.length > 0) {
        onSymptomDetected(data.symptoms, selectedLanguage);
      }
      
      if (onMedicalResponse) {
        onMedicalResponse(data);
      }

      // Speak the response if voice is enabled
      if (voiceEnabled && data.response) {
        speakResponse(data.response);
      }

      toast({
        title: "Voice Analysis Complete",
        description: `Detected ${data.symptoms?.length || 0} symptoms`,
      });

    } catch (error) {
      console.error('Voice processing error:', error);
      toast({
        title: "Processing Error",
        description: "Failed to analyze voice input. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Text-to-speech for medical responses
  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice based on selected language
    const voices = window.speechSynthesis.getVoices();
    const languageCode = selectedLanguage.split('-')[0];
    const matchingVoice = voices.find(voice => 
      voice.lang.startsWith(languageCode) || voice.lang.includes(languageCode)
    );
    
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Start/stop voice recognition
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Recognition Unavailable",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      recognitionRef.current.lang = selectedLanguage;
      recognitionRef.current.start();
    }
  };

  // Stop speech synthesis
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Change language
  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.lang = newLanguage;
          recognitionRef.current.start();
        }
      }, 100);
    }
  };

  const selectedLang = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage);

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 border-2 border-blue-200 dark:border-blue-800">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-blue-800 dark:text-blue-200">
          <Stethoscope className="h-6 w-6" />
          Voice Health Companion
          <Activity className="h-6 w-6" />
        </CardTitle>
        <p className="text-gray-600 dark:text-gray-400">
          Speak your symptoms in your preferred language for instant medical analysis
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Language Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Select Language
          </label>
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {selectedLang && (
                  <span className="flex items-center gap-2">
                    <span>{selectedLang.flag}</span>
                    <span>{selectedLang.name}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Voice Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-6 py-3 text-lg font-semibold rounded-full transition-all duration-300 ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="h-5 w-5" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" />
                Start Listening
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="flex items-center gap-2"
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="h-4 w-4" />
                Voice On
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4" />
                Voice Off
              </>
            )}
          </Button>

          {isSpeaking && (
            <Button
              variant="destructive"
              onClick={stopSpeaking}
              className="flex items-center gap-2"
            >
              <VolumeX className="h-4 w-4" />
              Stop Speaking
            </Button>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap gap-2 justify-center">
          {isListening && (
            <Badge variant="destructive" className="animate-pulse">
              🎤 Listening...
            </Badge>
          )}
          {isProcessing && (
            <Badge variant="secondary" className="animate-pulse">
              🧠 Analyzing...
            </Badge>
          )}
          {isSpeaking && (
            <Badge variant="default" className="animate-pulse">
              🔊 Speaking...
            </Badge>
          )}
        </div>

        {/* Real-time Transcript */}
        {transcript && (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Live Transcript:
            </h4>
            <p className="text-gray-600 dark:text-gray-400 italic">
              "{transcript}"
            </p>
          </div>
        )}

        {/* Detected Symptoms */}
        {detectedSymptoms.length > 0 && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Detected Symptoms:
            </h4>
            <div className="flex flex-wrap gap-2">
              {detectedSymptoms.map((symptom, index) => (
                <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                  {symptom}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Last Medical Response */}
        {lastResponse && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Medical Analysis:
            </h4>
            {lastResponse.diagnosis && (
              <div className="mb-2">
                <Badge variant="outline" className="mr-2">
                  Diagnosis: {lastResponse.diagnosis}
                </Badge>
                {lastResponse.confidence && (
                  <Badge variant="secondary">
                    Confidence: {lastResponse.confidence.toFixed(1)}%
                  </Badge>
                )}
              </div>
            )}
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {lastResponse.response}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <p>🎤 Click "Start Listening" and describe your symptoms clearly</p>
          <p>🌍 Supports multiple languages for global accessibility</p>
          <p>🔊 Enable voice responses for hands-free interaction</p>
        </div>
      </CardContent>
    </Card>
  );
}