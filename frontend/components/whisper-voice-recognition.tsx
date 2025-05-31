import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Square, Play, Pause, Upload, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhisperVoiceRecognitionProps {
  onTranscript: (text: string, confidence: number) => void;
  language: string;
  isProcessing?: boolean;
}

type RecordingState = 'idle' | 'recording' | 'stopped' | 'processing' | 'error';

export default function WhisperVoiceRecognition({ 
  onTranscript, 
  language,
  isProcessing = false 
}: WhisperVoiceRecognitionProps) {
  const { toast } = useToast();
  
  // State management
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  
  // Language mapping for Whisper
  const getWhisperLanguage = useCallback((lang: string) => {
    switch (lang) {
      case 'hindi': return 'hi';
      case 'hinglish': return 'hi'; // Whisper handles mixed Hindi-English well
      case 'english': return 'en';
      default: return 'hi';
    }
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Optimal for Whisper
        }
      });
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      // Create MediaRecorder with optimal settings for Whisper
      const options = {
        mimeType: 'audio/webm;codecs=opus', // Fallback to supported format
      };
      
      // Try different formats for compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose
          }
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        setAudioBlob(audioBlob);
        setRecordingState('stopped');
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Auto-process the recording
        processWithWhisper(audioBlob);
      };
      
      mediaRecorder.start(1000); // Collect data every second
      setRecordingState('recording');
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly for best recognition results",
      });
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRecordingState('error');
      toast({
        title: "Recording Failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Process audio with Whisper API
  const processWithWhisper = async (blob: Blob) => {
    setRecordingState('processing');
    
    try {
      // Convert blob to file for FormData
      const audioFile = new File([blob], 'recording.webm', { type: blob.type });
      
      // Prepare FormData for Whisper API
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', getWhisperLanguage(language));
      
      // Direct call to OpenAI Whisper API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || 'sk-placeholder'}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        // Fallback to browser speech recognition if Whisper fails
        throw new Error(`Whisper API failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.text) {
        const transcribedText = result.text.trim();
        
        setTranscript(transcribedText);
        setConfidence(0.9); // High confidence for Whisper
        
        // Send transcript to parent
        onTranscript(transcribedText, 0.9);
        
        toast({
          title: "Whisper Transcription Complete",
          description: `"${transcribedText.substring(0, 50)}${transcribedText.length > 50 ? '...' : ''}"`,
        });
      } else {
        throw new Error('No transcription received');
      }
      
      setRecordingState('idle');
      
    } catch (error) {
      console.error('Whisper transcription error:', error);
      
      // Fallback to browser speech recognition
      try {
        await fallbackToWebSpeech(audioBlob);
      } catch (fallbackError) {
        setRecordingState('error');
        toast({
          title: "Transcription Failed",
          description: "Both Whisper and browser recognition failed. Please try text input.",
          variant: "destructive",
        });
      }
    }
  };

  // Fallback to browser speech recognition
  const fallbackToWebSpeech = async (blob: Blob) => {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window)) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = getWhisperLanguage(language) === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        setConfidence(event.results[0][0].confidence || 0.7);
        onTranscript(transcript, event.results[0][0].confidence || 0.7);
        
        toast({
          title: "Browser Recognition Complete",
          description: `"${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`,
        });
        
        setRecordingState('idle');
        resolve(transcript);
      };

      recognition.onerror = () => {
        reject(new Error('Browser speech recognition failed'));
      };

      // Convert blob to audio element for browser recognition
      const audio = new Audio(URL.createObjectURL(blob));
      audio.play();
      recognition.start();
    });
  };

  // Reset state
  const resetRecording = () => {
    setRecordingState('idle');
    setAudioBlob(null);
    setTranscript('');
    setConfidence(0);
    setRecordingTime(0);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status message
  const getStatusMessage = () => {
    switch (recordingState) {
      case 'recording':
        return `🎤 Recording... ${formatTime(recordingTime)}`;
      case 'stopped':
        return '⏹️ Recording stopped. Processing...';
      case 'processing':
        return '⚡ Transcribing with Whisper AI...';
      case 'error':
        return '❌ Error occurred. Please try again.';
      default:
        return `🎙️ Ready to record in ${language === 'hindi' ? 'Hindi' : language === 'hinglish' ? 'Hinglish' : 'English'}`;
    }
  };

  // Get button color based on state
  const getButtonClass = () => {
    switch (recordingState) {
      case 'recording':
        return 'bg-red-500 hover:bg-red-600 animate-pulse';
      case 'processing':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        {/* Recording Controls */}
        <div className="flex justify-center">
          {recordingState === 'idle' || recordingState === 'error' ? (
            <Button
              onClick={startRecording}
              disabled={isProcessing}
              className={`w-20 h-20 rounded-full ${getButtonClass()}`}
            >
              <Mic className="h-8 w-8" />
            </Button>
          ) : recordingState === 'recording' ? (
            <Button
              onClick={stopRecording}
              className={`w-20 h-20 rounded-full ${getButtonClass()}`}
            >
              <Square className="h-8 w-8" />
            </Button>
          ) : (
            <Button
              disabled
              className={`w-20 h-20 rounded-full ${getButtonClass()}`}
            >
              <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
            </Button>
          )}
        </div>

        {/* Status Message */}
        <div className="text-center">
          <p className={`text-sm ${recordingState === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
            {getStatusMessage()}
          </p>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
            <div className="text-sm">
              <div className="font-medium text-gray-800 mb-1">
                ✓ Transcribed Text:
              </div>
              <div className="text-gray-700">
                "{transcript}"
              </div>
              {confidence > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Confidence: {Math.round(confidence * 100)}%
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error State with Retry */}
        {recordingState === 'error' && (
          <div className="flex justify-center space-x-2">
            <Button onClick={resetRecording} variant="outline" size="sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              Try Again
            </Button>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 text-center bg-blue-50 p-2 rounded">
          💡 Powered by OpenAI Whisper for accurate Hindi/Hinglish recognition
        </div>
      </CardContent>
    </Card>
  );
}