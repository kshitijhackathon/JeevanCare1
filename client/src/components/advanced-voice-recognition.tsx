import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Volume2, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdvancedVoiceRecognitionProps {
  onTranscript: (text: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  isProcessing?: boolean;
}

type RecognitionState = 'idle' | 'listening' | 'processing' | 'error';

export default function AdvancedVoiceRecognition({ 
  onTranscript, 
  language,
  onLanguageChange,
  isProcessing = false 
}: AdvancedVoiceRecognitionProps) {
  const { toast } = useToast();
  
  // State management
  const [state, setState] = useState<RecognitionState>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(0);
  const [silenceTimer, setSilenceTimer] = useState(0);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const silenceTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  
  // Language configurations
  const languageConfigs = {
    english: { 
      code: 'en-IN', 
      label: 'English',
      fallback: 'en-US'
    },
    hindi: { 
      code: 'hi-IN', 
      label: 'हिंदी (Hindi)',
      fallback: 'hi'
    },
    hinglish: { 
      code: 'hi-IN', 
      label: 'Hinglish (हिंग्लिश)',
      fallback: 'en-IN'
    }
  };

  // Check browser support and device type
  useEffect(() => {
    const checkSupport = () => {
      const hasSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setIsSupported(hasSupport);
      
      // Detect mobile device
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
      
      if (!hasSupport) {
        setErrorMessage('Voice recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      }
    };
    
    checkSupport();
  }, []);

  // Request microphone permission explicitly
  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately after permission check
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setErrorMessage('Microphone permission required. Please allow access and try again.');
      return false;
    }
  };

  // Enhanced error handling
  const handleRecognitionError = useCallback((event: any) => {
    setState('error');
    retryCountRef.current += 1;
    
    let userMessage = '';
    let shouldRetry = false;
    
    switch (event.error) {
      case 'no-speech':
        userMessage = "We couldn't hear you. Please speak clearly and try again.";
        shouldRetry = retryCountRef.current < 3;
        break;
      case 'audio-capture':
        userMessage = "Microphone access failed. Please check your microphone and permissions.";
        break;
      case 'not-allowed':
        userMessage = "Microphone permission denied. Please allow access in your browser settings.";
        break;
      case 'network':
        userMessage = "Network error. Please check your internet connection.";
        shouldRetry = true;
        break;
      case 'service-not-allowed':
        userMessage = "Speech service not available. Please try again later.";
        break;
      default:
        userMessage = `Recognition error: ${event.error}. Please try again.`;
        shouldRetry = retryCountRef.current < 2;
    }
    
    setErrorMessage(userMessage);
    toast({
      title: "Voice Recognition Error",
      description: userMessage,
      variant: "destructive",
    });
    
    // Auto-retry for certain errors
    if (shouldRetry) {
      setTimeout(() => {
        startListening();
      }, 2000);
    }
  }, [toast]);

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    if (!isSupported) return null;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Configuration for better accuracy
    const config = languageConfigs[language as keyof typeof languageConfigs];
    recognition.lang = config.code;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    
    // Mobile-specific optimizations
    if (isMobile) {
      recognition.continuous = false; // Better for mobile
      recognition.interimResults = true;
    }
    
    // Event handlers
    recognition.onstart = () => {
      setState('listening');
      setErrorMessage('');
      setInterimTranscript('');
      setFinalTranscript('');
      retryCountRef.current = 0;
      
      // Start silence detection
      silenceTimeoutRef.current = setTimeout(() => {
        if (state === 'listening') {
          recognition.stop();
          setErrorMessage("No speech detected. Please try speaking again.");
        }
      }, 5000);
    };
    
    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      
      // Clear silence timeout when speech is detected
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
          final += transcript;
          setConfidenceLevel(confidence);
        } else {
          interim += transcript;
        }
      }
      
      setInterimTranscript(interim);
      setFinalTranscript(final);
      
      // Auto-submit when user pauses
      if (final.trim()) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          onTranscript(final);
          stopListening();
        }, 1500);
      }
    };
    
    recognition.onerror = handleRecognitionError;
    
    recognition.onend = () => {
      setState('idle');
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
    
    return recognition;
  }, [isSupported, language, isMobile, state, handleRecognitionError, onTranscript]);

  // Start listening
  const startListening = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Voice recognition is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }
    
    // Request microphone permission first
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;
    
    try {
      const recognition = initializeRecognition();
      if (!recognition) return;
      
      recognitionRef.current = recognition;
      recognition.start();
      
      setState('listening');
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setErrorMessage('Failed to start voice recognition. Please try again.');
      setState('error');
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    
    setState('idle');
  };

  // Reset and retry
  const resetAndRetry = () => {
    stopListening();
    setErrorMessage('');
    setInterimTranscript('');
    setFinalTranscript('');
    retryCountRef.current = 0;
    setTimeout(() => startListening(), 500);
  };

  // Get status message
  const getStatusMessage = () => {
    switch (state) {
      case 'listening':
        return isMobile 
          ? `🎤 Listening in ${languageConfigs[language as keyof typeof languageConfigs].label}...`
          : `🎤 Listening in ${languageConfigs[language as keyof typeof languageConfigs].label}... Speak now!`;
      case 'processing':
        return '⚡ Processing your speech...';
      case 'error':
        return errorMessage;
      default:
        return `Click to start voice input in ${languageConfigs[language as keyof typeof languageConfigs].label}`;
    }
  };

  // Get button color based on state
  const getButtonClass = () => {
    switch (state) {
      case 'listening':
        return 'bg-red-500 hover:bg-red-600 animate-pulse';
      case 'processing':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  if (!isSupported) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <p className="text-sm text-gray-600">
            Voice recognition not supported. Please use a modern browser like Chrome, Edge, or Safari.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full bg-gray-50 rounded-lg p-2 border border-gray-200">
      {/* Ultra-compact single row layout */}
      <div className="flex items-center justify-between gap-2">
        {/* Language selector - minimal */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600">Lang:</span>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-16 h-6 text-xs border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">EN</SelectItem>
              <SelectItem value="hindi">हिं</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status - inline and minimal */}
        <div className="flex-1 text-center">
          <span className={`text-xs ${state === 'listening' ? 'text-green-600' : state === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
            {state === 'listening' ? '🎤 Listening...' : 
             state === 'processing' ? '⚡ Processing...' : 
             state === 'error' ? 'Error' : 'Tap mic'}
          </span>
        </div>

        {/* Voice button - compact */}
        <Button
          onClick={state === 'listening' ? stopListening : startListening}
          disabled={isProcessing || state === 'processing'}
          className={`w-8 h-8 rounded-full p-0 ${getButtonClass()}`}
        >
          {state === 'listening' ? (
            <MicOff className="h-3 w-3" />
          ) : state === 'processing' ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Mic className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Transcript - only when needed, very compact */}
      {(finalTranscript || interimTranscript) && (
        <div className="mt-1 p-1 bg-white rounded text-xs border border-gray-200">
          {finalTranscript && <span className="text-gray-800">✓ {finalTranscript}</span>}
          {interimTranscript && <span className="text-gray-500 italic"> {interimTranscript}</span>}
        </div>
      )}
    </div>
  );
}

// Add global types for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}