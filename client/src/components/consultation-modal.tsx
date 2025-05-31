import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import VoiceRecorder from "./voice-recorder";
import { UserRound, CheckCircle } from "lucide-react";
import type { Consultation } from "@shared/schema";

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConsultationModal({ isOpen, onClose }: ConsultationModalProps) {
  const [step, setStep] = useState<'input' | 'response' | 'success'>('input');
  const [symptoms, setSymptoms] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const { toast } = useToast();

  const consultationMutation = useMutation({
    mutationFn: async (data: { symptoms: string }) => {
      const response = await apiRequest("POST", "/api/consultations", data);
      return await response.json();
    },
    onSuccess: (data: Consultation) => {
      setAiResponse(data.aiResponse || '');
      setStep('response');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process consultation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSymptomsSubmit = (recordedSymptoms: string) => {
    setSymptoms(recordedSymptoms);
    consultationMutation.mutate({ symptoms: recordedSymptoms });
  };

  const handleBookConsultation = () => {
    setStep('success');
    toast({
      title: "Consultation Booked",
      description: "Your consultation has been scheduled successfully.",
    });
  };

  const handleClose = () => {
    setStep('input');
    setSymptoms('');
    setAiResponse('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-4 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center">AI Consultation</DialogTitle>
        </DialogHeader>
        
        {step === 'input' && (
          <div className="text-center p-6">
            <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserRound className="w-16 h-16 text-primary" />
            </div>
            
            <h3 className="font-semibold text-xl text-gray-800 mb-6">
              How can I help you today?
            </h3>
            
            <VoiceRecorder 
              onRecordingComplete={handleSymptomsSubmit}
              isProcessing={consultationMutation.isPending}
            />
          </div>
        )}

        {step === 'response' && (
          <div className="p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserRound className="w-8 h-8 text-primary" />
            </div>
            
            <h3 className="font-semibold text-lg text-gray-800 mb-4 text-center">
              AI Analysis
            </h3>
            
            <Card className="bg-gray-50 mb-6">
              <CardContent className="p-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {aiResponse}
                </p>
              </CardContent>
            </Card>
            
            <div className="space-y-3">
              <Button 
                onClick={handleBookConsultation}
                className="btn-secondary w-full"
              >
                Book Consultation with Doctor
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center p-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Consultation Booked!
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Your consultation has been scheduled. You will receive a confirmation email shortly.
            </p>
            
            <Button 
              onClick={handleClose}
              className="btn-primary w-full"
            >
              Back to Home
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
