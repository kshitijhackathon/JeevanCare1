import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mic, MicOff, MessageSquare, Send, Bot, User2, Stethoscope, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ContinuousVoiceRecognition from "@/components/continuous-voice-recognition";

interface PatientDetails {
  name: string;
  gender: string;
  age: string;
  bloodGroup: string;
}

interface ChatMessage {
  role: 'user' | 'doctor';
  content: string;
  timestamp: Date;
  type: 'text' | 'prescription' | 'emergency' | 'analysis';
}

interface MedicalResponse {
  responseText: string;
  followUp: string[];
  tests: string[];
  medicines: Array<{
    name: string;
    dose: string;
    freq: string;
    days: number;
  }>;
  severity: "low" | "moderate" | "high";
}

export default function MultilingualConsultation() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [step, setStep] = useState<'details' | 'consultation'>('details');
  const [patientDetails, setPatientDetails] = useState<PatientDetails>({
    name: '',
    gender: '',
    age: '',
    bloodGroup: ''
  });
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState('en');
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('hindi');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Language detection function
  const detectLanguage = (text: string): string => {
    const hindiPattern = /[\u0900-\u097F]/;
    const bengaliPattern = /[\u0980-\u09FF]/;
    const tamilPattern = /[\u0B80-\u0BFF]/;
    
    if (hindiPattern.test(text)) return "hi";
    if (bengaliPattern.test(text)) return "bn";
    if (tamilPattern.test(text)) return "ta";
    return "en";
  };

  // Speech synthesis function
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = detectedLanguage === 'hi' ? 'hi-IN' : 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  // Start consultation
  const startConsultation = () => {
    setStep('consultation');
    
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      role: 'doctor',
      content: detectedLanguage === 'hi' 
        ? `नमस्ते ${patientDetails.name}! मैं डॉ. एआई हूँ। आपकी स्वास्थ्य समस्या के बारे में बताएं।`
        : `Hello ${patientDetails.name}! I'm Dr. AI. Please tell me about your health concerns.`,
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages([welcomeMessage]);
    
    // Speak welcome message
    setTimeout(() => {
      speakText(welcomeMessage.content);
    }, 1000);
  };

  // Multilingual consultation mutation
  const consultationMutation = useMutation({
    mutationFn: async ({ message, patientDetails }: { message: string; patientDetails: PatientDetails }) => {
      const response = await fetch('/api/ai-doctor/multilingual-consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, patientDetails })
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setIsProcessing(false);
      
      if (data.success && data.medicalAdvice) {
        const medicalAdvice: MedicalResponse = data.medicalAdvice;
        
        const doctorMessage: ChatMessage = {
          role: 'doctor',
          content: medicalAdvice.responseText,
          timestamp: new Date(),
          type: medicalAdvice.medicines.length > 0 ? 'prescription' : 'analysis'
        };
        
        setMessages(prev => [...prev, doctorMessage]);
        
        // Speak the response
        speakText(medicalAdvice.responseText);
        
        // Show follow-up questions if any
        if (medicalAdvice.followUp.length > 0) {
          setTimeout(() => {
            medicalAdvice.followUp.forEach((question, index) => {
              setTimeout(() => {
                const followUpMessage: ChatMessage = {
                  role: 'doctor',
                  content: question,
                  timestamp: new Date(),
                  type: 'text'
                };
                setMessages(prev => [...prev, followUpMessage]);
                speakText(question);
              }, index * 3000);
            });
          }, 2000);
        }
        
        // Show emergency alert if high severity
        if (medicalAdvice.severity === 'high') {
          toast({
            title: "Emergency Alert",
            description: "Please seek immediate medical attention!",
            variant: "destructive"
          });
        }
      }
    },
    onError: (error) => {
      setIsProcessing(false);
      console.error('Consultation error:', error);
      toast({
        title: "Error",
        description: "Failed to process consultation. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle voice transcript
  const handleVoiceTranscript = async (transcript: string) => {
    if (transcript.trim()) {
      console.log('Voice transcript received:', transcript);
      
      // Auto-detect language
      const language = detectLanguage(transcript);
      if (language !== detectedLanguage) {
        setDetectedLanguage(language);
      }
      
      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: transcript,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Process with AI
      setIsProcessing(true);
      consultationMutation.mutate({
        message: transcript,
        patientDetails
      });
    }
  };

  // Handle text message
  const handleSendMessage = () => {
    if (currentMessage.trim()) {
      // Auto-detect language
      const language = detectLanguage(currentMessage);
      if (language !== detectedLanguage) {
        setDetectedLanguage(language);
      }
      
      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: currentMessage,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Process with AI
      setIsProcessing(true);
      consultationMutation.mutate({
        message: currentMessage,
        patientDetails
      });
      
      setCurrentMessage('');
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (step === 'details') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Multilingual AI Consultation</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Stethoscope className="h-5 w-5 mr-2 text-blue-600" />
                Patient Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={patientDetails.name}
                    onChange={(e) => setPatientDetails(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={patientDetails.age}
                    onChange={(e) => setPatientDetails(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Enter your age"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={patientDetails.gender} onValueChange={(value) => setPatientDetails(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select value={patientDetails.bloodGroup} onValueChange={(value) => setPatientDetails(prev => ({ ...prev, bloodGroup: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={startConsultation}
                className="w-full mt-6"
                disabled={!patientDetails.name || !patientDetails.age || !patientDetails.gender || !patientDetails.bloodGroup}
              >
                Start AI Consultation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4"
            onClick={() => setStep('details')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            AI Doctor Consultation - {detectedLanguage.toUpperCase()}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map((message, index) => (
              <div key={index} className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : message.type === 'prescription'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : message.type === 'emergency'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <div className="flex items-center mb-1">
                    {message.role === 'user' ? <User2 className="h-4 w-4 mr-1" /> : <Bot className="h-4 w-4 mr-1" />}
                    <span className="text-xs opacity-75">
                      {message.role === 'user' ? 'You' : 'Dr. AI'}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                  {message.role === 'doctor' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1 p-1 h-6"
                      onClick={() => speakText(message.content)}
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                  <div className="flex items-center">
                    <Bot className="h-4 w-4 mr-2" />
                    <span className="text-sm">Dr. AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="p-4 border-t bg-gray-50">
            {/* Voice Recognition */}
            <div className="mb-4">
              <ContinuousVoiceRecognition
                onTranscript={handleVoiceTranscript}
                language={detectedLanguage}
                onLanguageChange={setDetectedLanguage}
                isProcessing={isProcessing}
              />
            </div>
            
            {/* Text Input */}
            <div className="flex space-x-2">
              <Textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Type your symptoms here or use voice input above..."
                className="flex-1 resize-none"
                rows={2}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isProcessing}
                size="sm"
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}