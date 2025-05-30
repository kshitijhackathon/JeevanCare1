import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImprovedVoiceRecognitionProps {
  onTranscript: (text: string) => void;
  isProcessing?: boolean;
}

export default function ImprovedVoiceRecognition({ 
  onTranscript, 
  isProcessing = false 
}: ImprovedVoiceRecognitionProps) {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const isRestartingRef = useRef(false);

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Configure for better Hindi support
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.lang = 'hi-IN'; // Primary Hindi
    
    recognition.onstart = () => {
      console.log('Voice recognition started');
      setIsListening(true);
      isRestartingRef.current = false;
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Show live transcript
      setTranscript(finalTranscript + interimTranscript);

      // Process final transcript immediately
      if (finalTranscript.trim() && finalTranscript.trim().length > 2) {
        console.log('Processing Hindi voice input:', finalTranscript.trim());
        onTranscript(finalTranscript.trim());
        
        // Clear transcript after sending
        setTimeout(() => {
          setTranscript('');
        }, 1500);
      }
    };

    recognition.onerror = (event: any) => {
      console.log('Voice recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        toast({
          title: "माइक्रोफोन की अनुमति चाहिए",
          description: "कृपया माइक्रोफोन की अनुमति दें",
          variant: "destructive",
        });
        setIsListening(false);
        return;
      }
      
      // Don't restart on abort - it's intentional
      if (event.error === 'aborted') {
        return;
      }
      
      // Auto-restart for other errors if we're supposed to be listening
      if (isListening && !isRestartingRef.current) {
        setTimeout(() => {
          if (isListening && !isRestartingRef.current) {
            restartRecognition();
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      console.log('Voice recognition ended');
      setIsListening(false);
      
      // Auto-restart if we should still be listening
      if (isListening && !isRestartingRef.current && !isProcessing) {
        setTimeout(() => {
          if (isListening && !isRestartingRef.current) {
            restartRecognition();
          }
        }, 500);
      }
    };

    return recognition;
  }, [isSupported, onTranscript, toast, isListening, isProcessing]);

  // Start recognition
  const startRecognition = useCallback(() => {
    if (!isSupported) {
      toast({
        title: "समर्थित नहीं",
        description: "आपका ब्राउज़र वॉइस रिकॉग्निशन को सपोर्ट नहीं करता",
        variant: "destructive",
      });
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      
      recognitionRef.current = initializeRecognition();
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      }
    } catch (error) {
      console.log('Failed to start recognition:', error);
      toast({
        title: "वॉइस रिकॉग्निशन शुरू नहीं हो सका",
        description: "कृपया फिर से कोशिश करें",
        variant: "destructive",
      });
    }
  }, [isSupported, initializeRecognition, toast]);

  // Stop recognition
  const stopRecognition = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setTranscript('');
  }, []);

  // Restart recognition
  const restartRecognition = useCallback(() => {
    if (isRestartingRef.current) return;
    
    isRestartingRef.current = true;
    setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      setTimeout(() => {
        startRecognition();
        isRestartingRef.current = false;
      }, 300);
    }, 100);
  }, [startRecognition]);

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  if (!isSupported) {
    return (
      <div className="text-center text-gray-500 p-4">
        <p>आपका ब्राउज़र वॉइस रिकॉग्निशन को सपोर्ट नहीं करता</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Voice Control Button */}
      <div className="flex justify-center">
        <Button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`w-16 h-16 rounded-full ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isListening ? (
            <MicOff className="h-6 w-6 text-white" />
          ) : (
            <Mic className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>

      {/* Status and Transcript */}
      <div className="text-center">
        {isProcessing ? (
          <p className="text-blue-600 font-medium">AI जवाब दे रहा है...</p>
        ) : isListening ? (
          <p className="text-green-600 font-medium">
            🎤 सुन रहा है... बोलिए
          </p>
        ) : (
          <p className="text-gray-500">
            माइक्रोफोन बटन दबाकर बोलना शुरू करें
          </p>
        )}

        {transcript && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border">
            <p className="text-sm text-gray-700">
              <strong>आप बोल रहे हैं:</strong> {transcript}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}