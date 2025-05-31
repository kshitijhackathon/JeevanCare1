import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface NaturalVoiceAssistantProps {
  onTranscript: (text: string, language: string) => void;
  onResponse: (response: any) => void;
  isLoading?: boolean;
  language?: string;
}

export function NaturalVoiceAssistant({ 
  onTranscript, 
  onResponse, 
  isLoading = false,
  language = 'hindi'
}: NaturalVoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [detectedLanguage, setDetectedLanguage] = useState(language);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize speech recognition with enhanced settings
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Enhanced recognition settings for better multilingual support
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    
    // Set language based on detected/selected language
    const languageMap: Record<string, string> = {
      hindi: 'hi-IN',
      english: 'en-IN',
      bengali: 'bn-IN',
      tamil: 'ta-IN',
      telugu: 'te-IN'
    };
    
    recognition.lang = languageMap[detectedLanguage] || 'hi-IN';

    recognition.onstart = () => {
      console.log('Voice recognition started');
      setIsListening(true);
    };

    recognition.onresult = (event) => {
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

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      // Send final transcript for processing
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim(), detectedLanguage);
        setTranscript(''); // Clear after sending
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'no-speech') {
        // Restart recognition on no-speech error
        setTimeout(() => {
          if (isListening) {
            startListening();
          }
        }, 1000);
      } else {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      console.log('Voice recognition ended');
      setIsListening(false);
      
      // Auto-restart if still in listening mode
      if (isListening) {
        setTimeout(startListening, 500);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [detectedLanguage, isListening, onTranscript]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Play AI response with natural voice
  const playAIResponse = async (text: string, responseType = 'response') => {
    if (!audioEnabled) return;

    try {
      setIsSpeaking(true);
      
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          language: detectedLanguage,
          type: responseType
        }),
      });

      if (response.ok && response.headers.get('content-type')?.includes('audio')) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          await audioRef.current.play();
        }
      } else {
        console.log('Audio generation failed, using text response only');
      }
    } catch (error) {
      console.error('Failed to play AI response:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  // Auto-play greeting when component mounts
  useEffect(() => {
    if (audioEnabled) {
      playAIResponse('', 'greeting');
    }
  }, []);

  // Handle audio end event
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleAudioEnd = () => {
        setIsSpeaking(false);
      };
      
      audio.addEventListener('ended', handleAudioEnd);
      return () => audio.removeEventListener('ended', handleAudioEnd);
    }
  }, []);

  // Play response when new response is received
  useEffect(() => {
    const handleNewResponse = (response: any) => {
      if (response?.response && audioEnabled) {
        playAIResponse(response.response);
      }
    };

    // This would be called from parent component
    // handleNewResponse is exposed through ref or callback
  }, []);

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-800">
      <div className="space-y-4">
        {/* Voice Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              onClick={toggleListening}
              size="lg"
              className={`rounded-full ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled={isLoading || isSpeaking}
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
            
            <Button
              onClick={() => setAudioEnabled(!audioEnabled)}
              variant="outline"
              size="lg"
              className="rounded-full"
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
          </div>

          {/* Language Indicator */}
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 px-3 py-1 rounded-full">
            {detectedLanguage.charAt(0).toUpperCase() + detectedLanguage.slice(1)}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="text-center">
          {isListening && (
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              🎤 सुन रहा हूं... / Listening...
            </div>
          )}
          
          {isSpeaking && (
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">
              🔊 बोल रहा हूं... / Speaking...
            </div>
          )}
          
          {isLoading && (
            <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
              🤔 सोच रहा हूं... / Thinking...
            </div>
          )}
        </div>

        {/* Live Transcript */}
        {transcript && (
          <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">आप कह रहे हैं / You're saying:</div>
            <div className="text-gray-800 dark:text-gray-200">{transcript}</div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          <div className="mb-1">🎯 अपने लक्षण बताएं या सवाल पूछें</div>
          <div>🎯 Describe your symptoms or ask questions</div>
        </div>

        {/* Hidden Audio Element */}
        <audio 
          ref={audioRef} 
          preload="none"
          className="hidden"
        />
      </div>
    </Card>
  );
}

// Expose playResponse method for parent components
export const useVoiceAssistant = () => {
  const assistantRef = useRef<{ playAIResponse: (text: string, type?: string) => void }>(null);
  
  return {
    playResponse: (text: string, type = 'response') => {
      if (assistantRef.current) {
        assistantRef.current.playAIResponse(text, type);
      }
    },
    assistantRef
  };
};