import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square } from "lucide-react";

interface VoiceRecorderProps {
  onRecordingComplete: (transcript: string) => void;
  isProcessing?: boolean;
}

export default function VoiceRecorder({ onRecordingComplete, isProcessing = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);

  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording and simulate transcript
      setIsRecording(false);
      // Simulate processing and return sample symptoms
      setTimeout(() => {
        const sampleSymptoms = [
          "I have been experiencing headaches and mild fever for the past 2 days",
          "I have a persistent cough and feeling tired lately",
          "I'm having stomach pain and nausea since yesterday",
          "I have muscle aches and feeling cold despite normal temperature"
        ];
        const randomSymptom = sampleSymptoms[Math.floor(Math.random() * sampleSymptoms.length)];
        onRecordingComplete(randomSymptom);
      }, 1000);
    } else {
      // Start recording
      setIsRecording(true);
      // Auto-stop after 5 seconds for demo
      setTimeout(() => {
        if (isRecording) {
          handleToggleRecording();
        }
      }, 5000);
    }
  };

  if (isProcessing) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Mic className="w-8 h-8 text-primary" />
        </div>
        <p className="text-sm text-gray-600">Processing your symptoms...</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <Button
        onClick={handleToggleRecording}
        disabled={isProcessing}
        className={`w-20 h-20 rounded-full shadow-lg transition-all transform hover:scale-105 ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600 recording-pulse' 
            : 'bg-primary hover:bg-primary/90'
        }`}
      >
        {isRecording ? (
          <Square className="w-8 h-8 text-white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
      </Button>
      
      <p className="text-sm text-gray-600 mt-4">
        {isRecording ? 'Recording... Tap to stop' : 'Press to record your symptoms'}
      </p>
      
      {isRecording && (
        <div className="flex items-center justify-center space-x-2 text-red-500 mt-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Recording...</span>
        </div>
      )}
    </div>
  );
}
