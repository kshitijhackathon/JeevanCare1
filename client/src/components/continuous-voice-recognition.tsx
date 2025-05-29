import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContinuousVoiceRecognitionProps {
  onTranscript: (text: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  isProcessing?: boolean;
}

type RecognitionState = 'listening' | 'paused' | 'error';

export default function ContinuousVoiceRecognition({ 
  onTranscript, 
  language, 
  onLanguageChange, 
  isProcessing = false 
}: ContinuousVoiceRecognitionProps) {
  const { toast } = useToast();
  const [state, setState] = useState<RecognitionState>('listening');
  const [isEnabled, setIsEnabled] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Language configurations
  const languageConfigs = {
    english: { code: 'en-US', label: 'English' },
    hindi: { code: 'hi-IN', label: 'हिंदी' }
  };

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = languageConfigs[language as keyof typeof languageConfigs].code;

    recognition.onstart = () => {
      setState('listening');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence || 0.8;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          setConfidenceLevel(confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      // Show live transcript for user feedback
      setTranscript(finalTranscript + interimTranscript);

      // Process final transcript if it's substantial
      if (finalTranscript.trim() && finalTranscript.trim().length > 3) {
        console.log('Processing voice input:', finalTranscript.trim());
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Send to parent for processing
        onTranscript(finalTranscript.trim());
        
        // Clear transcript after sending
        timeoutRef.current = setTimeout(() => {
          setTranscript('');
        }, 2000);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setState('error');
      
      // Auto-restart after error (except for permission errors)
      if (event.error !== 'not-allowed' && isEnabled) {
        restartTimeoutRef.current = setTimeout(() => {
          if (isEnabled) {
            startListening();
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still enabled
      if (isEnabled && state !== 'paused') {
        restartTimeoutRef.current = setTimeout(() => {
          if (isEnabled) {
            startListening();
          }
        }, 500);
      }
    };

    return recognition;
  }, [language, isEnabled, onTranscript, state, isSupported]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Voice recognition is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      const recognition = initializeRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      recognition.start();
      setState('listening');
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setState('error');
    }
  }, [initializeRecognition, isSupported, toast]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    setState('paused');
  }, []);

  // Toggle voice recognition
  const toggleListening = () => {
    setIsEnabled(!isEnabled);
    if (isEnabled) {
      stopListening();
    } else {
      setState('listening');
    }
  };

  // Start listening when component mounts and when enabled
  useEffect(() => {
    if (isEnabled && isSupported) {
      startListening();
    }

    return () => {
      stopListening();
    };
  }, [isEnabled, language, startListening, stopListening, isSupported]);

  // Enhanced cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch (e) {
        console.log('Voice recognition cleanup:', e);
      }
      recognitionRef.current = null;
    }
    setIsEnabled(false);
    setState('paused');
    setTranscript('');
  }, []);

  // Cleanup on unmount and expose for navigation cleanup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).voiceRecognitionCleanup = cleanup;
    }
    return cleanup;
  }, [cleanup]);

  if (!isSupported) {
    return (
      <div className="w-full bg-red-50 rounded-lg p-3 border border-red-200">
        <p className="text-sm text-red-600 text-center">
          Voice recognition not supported. Please use a modern browser.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 border border-blue-200">
      {/* Control Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Lang:</span>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-20 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">EN</SelectItem>
              <SelectItem value="hindi">हिं</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Display */}
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2">
            {isEnabled && state === 'listening' && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">Always Listening</span>
                <Volume2 className="h-3 w-3 text-green-600" />
              </>
            )}
            {!isEnabled && (
              <span className="text-xs text-gray-500">Voice Off</span>
            )}
            {state === 'error' && (
              <span className="text-xs text-red-600">Error - Restarting...</span>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <Button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`w-8 h-8 rounded-full p-0 ${
            isEnabled 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-gray-400 hover:bg-gray-500'
          }`}
        >
          {isEnabled ? (
            <Mic className="h-3 w-3 text-white" />
          ) : (
            <MicOff className="h-3 w-3 text-white" />
          )}
        </Button>
      </div>

      {/* Live Transcript */}
      {transcript && (
        <div className="mt-2 p-2 bg-white rounded border text-xs">
          <span className="text-gray-700">🎤 {transcript}</span>
          {confidenceLevel > 0 && (
            <span className="ml-2 text-gray-500">
              ({Math.round(confidenceLevel * 100)}%)
            </span>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-500">
          {isEnabled 
            ? "Speak naturally - I'm always listening" 
            : "Click mic to enable voice input"
          }
        </p>
      </div>
    </div>
  );
}

// Global types for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}