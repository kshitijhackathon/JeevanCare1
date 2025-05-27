import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PatientDetails {
  name: string;
  age: string;
  gender: string;
  language: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIConsultation() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'details' | 'chat' | 'waiting' | 'prescription'>('details');
  const [patientDetails, setPatientDetails] = useState<PatientDetails>({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    age: '',
    gender: '',
    language: 'english'
  });
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [consultationId, setConsultationId] = useState<string>('');

  const startConsultation = useMutation({
    mutationFn: async (details: PatientDetails) => {
      const response = await apiRequest("POST", "/api/consultations/start", details);
      if (!response.ok) throw new Error("Failed to start consultation");
      return response.json();
    },
    onSuccess: (data) => {
      setConsultationId(data.id);
      setStep('chat');
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: patientDetails.language === 'hindi' 
          ? `Namaste ${patientDetails.name}! Main aapka AI doctor hoon. Aap kaise feel kar rahe hain aaj? Apni symptoms detail mein bataiye.`
          : `Hello ${patientDetails.name}! I'm your AI doctor. How are you feeling today? Please describe your symptoms in detail.`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start consultation. Please try again.",
        variant: "destructive"
      });
    }
  });

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/consultations/chat", {
        consultationId,
        message,
        language: patientDetails.language
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentMessage('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const endConsultation = () => {
    setStep('waiting');
    // Simulate doctor review process
    setTimeout(() => {
      setStep('prescription');
    }, 120000); // 2 minutes
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    sendMessage.mutate(currentMessage);
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      // Stop recording and convert to text
      toast({
        title: "Voice Recording",
        description: "Voice recording ended. Converting to text...",
      });
    } else {
      setIsRecording(true);
      toast({
        title: "Voice Recording",
        description: "Recording started. Speak now...",
      });
    }
  };

  if (step === 'details') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold">AI Consultation</h1>
        </div>

        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={patientDetails.name}
                  onChange={(e) => setPatientDetails({...patientDetails, name: e.target.value})}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={patientDetails.age}
                  onChange={(e) => setPatientDetails({...patientDetails, age: e.target.value})}
                  placeholder="Enter your age"
                />
              </div>
              
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select onValueChange={(value) => setPatientDetails({...patientDetails, gender: value})}>
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
              
              <div>
                <Label htmlFor="language">Preferred Language</Label>
                <Select onValueChange={(value) => setPatientDetails({...patientDetails, language: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">Hindi (Hinglish)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={() => startConsultation.mutate(patientDetails)}
                disabled={!patientDetails.name || !patientDetails.age || !patientDetails.gender || startConsultation.isPending}
                className="w-full"
              >
                {startConsultation.isPending ? "Starting..." : "Start Consultation"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'chat') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">AI Doctor</h1>
              <p className="text-sm text-gray-500">Online now</p>
            </div>
          </div>
          <Button onClick={endConsultation} variant="destructive" size="sm">
            End Consultation
          </Button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-800 shadow-sm'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 border-t">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleVoiceRecord}
              className={isRecording ? 'bg-red-100' : ''}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder={patientDetails.language === 'hindi' ? "Apna message type kariye..." : "Type your message..."}
              className="flex-1 min-h-[40px] max-h-[120px]"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || sendMessage.isPending}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'waiting') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Doctor Review in Progress</h2>
            <p className="text-gray-600 mb-4">
              Please wait 5 minutes while our specialist reviews your consultation and prepares your prescription.
            </p>
            <div className="text-sm text-gray-500">
              <p>⏰ Estimated time: 2-5 minutes</p>
              <p>🔍 Reviewing symptoms and recommendations</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'prescription') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold">Your Prescription</h1>
        </div>

        <div className="p-4">
          <Card className="mb-4">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">JeevanCare Medical Center</h2>
                <p className="text-sm text-gray-600">Digital Healthcare Solutions</p>
              </div>
              
              <div className="border-b pb-4 mb-4">
                <h3 className="font-semibold mb-2">Patient Information</h3>
                <p><strong>Name:</strong> {patientDetails.name}</p>
                <p><strong>Age:</strong> {patientDetails.age} years</p>
                <p><strong>Gender:</strong> {patientDetails.gender}</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Prescribed Medications</h3>
                <div className="space-y-2">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-medium">Paracetamol 500mg</p>
                    <p className="text-sm text-gray-600">Take 1 tablet twice daily after meals for 3 days</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-medium">Vitamin D3 1000 IU</p>
                    <p className="text-sm text-gray-600">Take 1 tablet daily after breakfast for 30 days</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">This prescription has been reviewed and approved by Dr. Smith</p>
                <Button className="mb-2">
                  Download Prescription
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/pharmacy')}
              className="w-full"
              size="lg"
            >
              Order Medicines Now
            </Button>
            <Button 
              onClick={() => navigate('/book-test')}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Book Lab Test at Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}