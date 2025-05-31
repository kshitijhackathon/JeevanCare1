import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface EnhancedVoiceRecognitionProps {
  onTranscript: (text: string) => void;
  language: string;
  isProcessing?: boolean;
}

export default function EnhancedVoiceRecognition({ 
  onTranscript, 
  language, 
  isProcessing = false 
}: EnhancedVoiceRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'hindi' ? 'hi-IN' : 'en-US';
    recognition.maxAlternatives = 3;

    let finalTranscript = '';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      finalTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }

      setTranscript(finalTranscript + interimTranscript);

      if (finalTranscript.trim()) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          onTranscript(finalTranscript);
          setTranscript('');
        }, 2000);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    clearTimeout(timeoutRef.current);
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <Button
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        className={`w-16 h-16 rounded-full ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </Button>
      
      {transcript && (
        <div className="bg-gray-100 p-3 rounded-lg max-w-md text-center">
          <p className="text-sm text-gray-700">{transcript}</p>
        </div>
      )}
      
      <p className="text-sm text-gray-600 text-center">
        {isListening 
          ? `Listening in ${language === 'hindi' ? 'Hindi' : 'English'}...` 
          : 'Click to start voice input'
        }
      </p>
    </div>
  );
}