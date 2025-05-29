import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Video, VideoOff, Mic, MicOff, MessageSquare, Phone, Camera, FileText, Send, Download, Bot, User2, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import PrescriptionTemplate from "@/components/prescription-template";
import ContinuousVoiceRecognition from "@/components/continuous-voice-recognition";
import PersonalizedAIAvatar from "@/components/personalized-ai-avatar";
import { extractEntities, mergeWithContext } from "@/lib/symptomNLP";
import { getCtx, setCtx, addConversationTurn, resetCtx } from "@/lib/contextStore";
import { buildDoctorPrompt, generateFollowUpQuestions } from "@/lib/doctorPrompt";

interface PatientDetails {
  name: string;
  gender: string;
  age: string;
  bloodGroup: string;
  language: string;
}

interface ChatMessage {
  role: 'user' | 'doctor';
  content: string;
  timestamp: Date;
  type: 'text' | 'prescription';
  prescription?: any;
}

export default function EnhancedAIConsultation() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [step, setStep] = useState<'details' | 'video-call'>('details');
  const [hasStartedCall, setHasStartedCall] = useState(false);
  const [patientDetails, setPatientDetails] = useState<PatientDetails>({
    name: '',
    gender: '',
    age: '',
    bloodGroup: '',
    language: 'english'
  });
  
  // Video call state
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [detectedSymptoms, setDetectedSymptoms] = useState<string[]>([]);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start video call with enhanced error handling
  const startVideoCall = async () => {
    console.log('Starting video call...', patientDetails);
    
    if (!patientDetails.name || !patientDetails.age || !patientDetails.gender || !patientDetails.bloodGroup) {
      toast({
        title: "Missing Information",
        description: "Please fill in all patient details before starting consultation.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Request camera permission with graceful fallback
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }, 
          audio: true 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        
        streamRef.current = stream;
        setIsCameraOn(true);
      }
      
      // Transition to video call
      setStep('video-call');
      setHasStartedCall(true);
      
      // Add welcome message with enhanced medical context
      const welcomeMessage: ChatMessage = {
        role: 'doctor',
        content: patientDetails.language === 'hindi' 
          ? `Namaste ${patientDetails.name}! Main aapka AI doctor hun. Aap apne symptoms detail mein bata sakte hain - voice ya text dono se. Main accurate diagnosis aur treatment provide karunga.`
          : `Hello ${patientDetails.name}! I'm your AI doctor. You can describe your symptoms in detail - either by voice or text. I'll provide accurate diagnosis and treatment.`,
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages([welcomeMessage]);
      
      console.log('Video consultation started successfully');
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Access Issue",
        description: "Camera permission denied. You can still continue with voice and text consultation.",
        variant: "destructive",
      });
      
      // Continue without camera
      setStep('video-call');
      setHasStartedCall(true);
      setIsCameraOn(false);
    }
  };

  // Initialize context when consultation starts
  useEffect(() => {
    if (step === 'video-call' && !getCtx().sessionId) {
      const initialCtx = resetCtx();
      setCtx({
        ...initialCtx,
        userInfo: {
          name: patientDetails.name,
          age: patientDetails.age,
          gender: patientDetails.gender,
          bloodGroup: patientDetails.bloodGroup,
          language: patientDetails.language
        }
      });
    }
  }, [step, patientDetails]);

  // Handle voice transcript with immediate symptom detection
  const handleVoiceTranscript = async (transcript: string) => {
    if (transcript.trim()) {
      console.log('Voice transcript received:', transcript);
      
      // Process with enhanced symptom detection before sending
      try {
        const { detectSymptomsFromText, detectDiseaseFromText } = await import('@/lib/enhanced-symptom-detection.js');
        
        // First try to detect specific disease
        const diseaseResult = detectDiseaseFromText(transcript);
        console.log('Disease detection result:', diseaseResult);
        
        if (diseaseResult) {
          // Add the detected disease as a symptom for tracking
          setDetectedSymptoms(prev => Array.from(new Set([...prev, diseaseResult.disease])));
          console.log('Detected disease from voice:', diseaseResult.disease);
          
          // Generate immediate response for the detected disease
          const response = patientDetails.language === 'hindi' 
            ? `समझ गया, आपको ${diseaseResult.disease} की समस्या है। दवा: ${diseaseResult.medication}। सावधानी: ${diseaseResult.warning}`
            : `I understand you have ${diseaseResult.disease}. Treatment: ${diseaseResult.medication}. Warning: ${diseaseResult.warning}`;
          
          const doctorMessage = {
            role: 'doctor' as const,
            content: response,
            timestamp: new Date(),
            type: 'text' as const
          };
          
          setMessages(prev => [...prev, {
            role: 'user' as const,
            content: transcript,
            timestamp: new Date(),
            type: 'text' as const
          }, doctorMessage]);
          
          return; // Don't process further if disease detected
        }
        
        // Fallback to general symptom detection
        const symptomContext = detectSymptomsFromText(transcript);
        if (symptomContext.symptoms && symptomContext.symptoms.length > 0) {
          const newSymptoms = symptomContext.symptoms.map((s: any) => s.normalized || s.original || s);
          setDetectedSymptoms(prev => Array.from(new Set([...prev, ...newSymptoms])));
          console.log('Detected symptoms from voice:', newSymptoms);
        }
      } catch (error) {
        console.error('Error processing voice transcript:', error);
      }
      
      // Send the message for AI response
      handleSendMessage(transcript);
    }
  };

  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    setPatientDetails(prev => ({ ...prev, language: newLanguage }));
  };

  // Enhanced message processing with NLP
  const processMessageWithNLP = (message: string) => {
    // Extract entities using the new NLP system
    const entities = extractEntities(message, patientDetails.language === 'hindi' ? 'hi-IN' : 'en-US');
    
    // Get current context and merge with new entities
    const currentCtx = getCtx();
    const updatedCtx = mergeWithContext(entities, currentCtx);
    setCtx(updatedCtx);
    
    // Add conversation turn
    addConversationTurn('user', message, entities);
    
    // Update detected symptoms for UI
    const newSymptoms = entities
      .filter((entity: any) => entity.type === 'symptom')
      .map((entity: any) => entity.entity);
    
    if (newSymptoms.length > 0) {
      setDetectedSymptoms(prev => Array.from(new Set([...prev, ...newSymptoms])));
    }
    
    return { entities, updatedCtx };
  };

  // Send message mutation with enhanced symptom detection
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      // Use our enhanced symptom detection locally first
      const { detectSymptomsFromText, generateContextualResponse } = await import('@/lib/enhanced-symptom-detection.js');
      const symptomContext = detectSymptomsFromText(message);
      
      // Generate response using our enhanced detection
      if (symptomContext.detectedDisease || symptomContext.symptoms.length > 0) {
        const response = generateContextualResponse(symptomContext.symptoms, symptomContext, patientDetails);
        return { 
          response,
          symptoms: symptomContext.symptoms,
          detectedDisease: symptomContext.detectedDisease,
          local: true 
        };
      }
      
      // Fallback to API if needed
      try {
        const response = await apiRequest("POST", "/api/ai-doctor/groq-medical-chat", {
          message,
          language: patientDetails.language,
          patientDetails,
          conversationHistory: messages.slice(-5)
        });
        if (!response.ok) throw new Error("API failed, using local detection");
        return await response.json();
      } catch (error) {
        // Use local processing as fallback
        const basicResponse = patientDetails.language === 'hindi' 
          ? "Main aapke symptoms samjhne ki koshish kar raha hun. Kripaya aur detail mein bataaiye."
          : "I'm analyzing your symptoms. Please provide more details about your condition.";
        return { response: basicResponse, local: true };
      }
    },
    onSuccess: (data) => {
      const doctorMessage: ChatMessage = {
        role: 'doctor',
        content: data.response,
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, doctorMessage]);
      
      // Extract symptoms from the response and update detected symptoms
      if (data.symptoms && data.symptoms.length > 0) {
        const newSymptoms = data.symptoms.map((s: any) => s.normalized || s.original || s);
        setDetectedSymptoms(prev => Array.from(new Set([...prev, ...newSymptoms])));
      }
      
      // If disease detected, add it to symptoms
      if (data.detectedDisease) {
        setDetectedSymptoms(prev => Array.from(new Set([...prev, data.detectedDisease.disease])));
      }
      
      // Text-to-speech
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.response);
        utterance.lang = patientDetails.language === 'hindi' ? 'hi-IN' : 'en-US';
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      }
      
      setIsProcessing(false);
    },
    onError: () => {
      setIsProcessing(false);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = (messageText?: string) => {
    const message = messageText || currentMessage;
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsProcessing(true);
    sendMessage.mutate(message);
  };

  // Generate prescription using enhanced detection
  const generatePrescription = async () => {
    try {
      // Use local medication suggestions from our enhanced detection
      const { generateMedicationSuggestions, DISEASE_DATABASE } = await import('@/lib/enhanced-symptom-detection.js');
      
      // Find detected disease and generate appropriate medications
      let medications = [];
      let prescriptionText = '';
      
      if (detectedSymptoms.length > 0) {
        // Check if any detected symptoms match diseases in our database
        for (const [disease, info] of Object.entries(DISEASE_DATABASE)) {
          const hasMatchingSymptom = detectedSymptoms.some(symptom => 
            info.hinglish.some(keyword => 
              symptom.toLowerCase().includes(keyword.toLowerCase()) ||
              keyword.toLowerCase().includes(symptom.toLowerCase())
            )
          );
          
          if (hasMatchingSymptom) {
            const prescription = {
              patientName: patientDetails.name,
              age: patientDetails.age,
              gender: patientDetails.gender,
              bloodGroup: patientDetails.bloodGroup,
              diagnosis: disease,
              medications: [{
                name: info.medication,
                dosage: "As prescribed",
                frequency: "Follow medical advice",
                duration: "As needed"
              }],
              instructions: [info.warning],
              doctorName: getConsistentDoctorName(),
              clinicName: "Jeevan Care Digital Health",
              date: new Date().toLocaleDateString()
            };
            
            const prescriptionMessage: ChatMessage = {
              role: 'doctor',
              content: `Prescription generated for ${disease}. Please follow the medication guidelines carefully.`,
              timestamp: new Date(),
              type: 'prescription',
              prescription: prescription
            };
            
            setMessages(prev => [...prev, prescriptionMessage]);
            setShowPrescription(true);
            return;
          }
        }
        
        // Fallback: generate general prescription for symptoms
        medications = generateMedicationSuggestions(null, detectedSymptoms.map(s => ({ normalized: s })));
        
        const generalPrescription = {
          patientName: patientDetails.name,
          age: patientDetails.age,
          gender: patientDetails.gender,
          bloodGroup: patientDetails.bloodGroup,
          diagnosis: `Symptoms: ${detectedSymptoms.join(', ')}`,
          medications: medications,
          instructions: ["Follow medication schedule", "Rest adequately", "Stay hydrated"],
          doctorName: getConsistentDoctorName(),
          clinicName: "Jeevan Care Digital Health",
          date: new Date().toLocaleDateString()
        };
        
        const prescriptionMessage: ChatMessage = {
          role: 'doctor',
          content: 'Prescription generated based on your symptoms. Please review and follow the instructions.',
          timestamp: new Date(),
          type: 'prescription',
          prescription: generalPrescription
        };
        
        setMessages(prev => [...prev, prescriptionMessage]);
        setShowPrescription(true);
      } else {
        toast({
          title: "No Symptoms Detected",
          description: "Please describe your symptoms first to generate a prescription.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Prescription generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate prescription. Please try again.",
        variant: "destructive",
      });
    }
  };

  // End consultation with proper cleanup
  const endConsultation = () => {
    try {
      // Stop all media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Media track stopped:', track.kind);
        });
        streamRef.current = null;
      }
      
      // Reset video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      // Reset states
      setIsCameraOn(false);
      setStep('details');
      setHasStartedCall(false);
      setMessages([]);
      setDetectedSymptoms([]);
      setCurrentMessage('');
      setIsProcessing(false);
      setShowPrescription(false);
      
      // Generate consultation summary
      const summary = generateConsultationSummary();
      toast({
        title: "Consultation Ended Successfully",
        description: summary,
        duration: 5000,
      });
      
      console.log('Consultation ended and cleaned up');
    } catch (error) {
      console.error('Error ending consultation:', error);
      toast({
        title: "Session Ended",
        description: "Consultation completed. Thank you for using our service.",
        duration: 3000,
      });
    }
  };

  const extractSymptomsFromResponse = (response: string): string[] => {
    const symptoms = [];
    const symptomsMap = {
      'fever': ['fever', 'bukhar', 'temperature'],
      'headache': ['headache', 'sir dard', 'migraine'],
      'stomach pain': ['stomach pain', 'pet dard', 'abdominal'],
      'chest pain': ['chest pain', 'seene mein dard'],
      'cough': ['cough', 'khansi']
    };
    
    for (const [symptom, keywords] of Object.entries(symptomsMap)) {
      if (keywords.some(keyword => response.toLowerCase().includes(keyword))) {
        symptoms.push(symptom);
      }
    }
    
    return symptoms;
  };



  // Get consistent doctor name based on patient details
  const getConsistentDoctorName = (): string => {
    const patientName = patientDetails.name?.toLowerCase() || 'patient';
    const hash = patientName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const patientGender = patientDetails.gender?.toLowerCase();
    if (patientGender === 'male') {
      const femaleNames = ['Dr. Priya Sharma', 'Dr. Anita Patel', 'Dr. Kavya Singh'];
      return femaleNames[hash % femaleNames.length];
    } else {
      const maleNames = ['Dr. Rajesh Kumar', 'Dr. Amit Gupta', 'Dr. Vikash Joshi'];
      return maleNames[hash % maleNames.length];
    }
  };

  const generateConsultationSummary = (): string => {
    const symptomsText = detectedSymptoms.length > 0 
      ? `Symptoms detected: ${detectedSymptoms.join(', ')}`
      : 'General consultation completed';
    
    return `${symptomsText}. Treatment recommendations provided. Please follow the prescribed medications and instructions.`;
  };

  if (step === 'details') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
        <div className="max-w-lg mx-auto">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg">
              <CardTitle className="text-center flex items-center justify-center space-x-2">
                <Stethoscope className="h-6 w-6" />
                <span>AI Doctor Consultation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={patientDetails.name}
                    onChange={(e) => setPatientDetails(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={patientDetails.age}
                    onChange={(e) => setPatientDetails(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Enter your age"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={patientDetails.gender} onValueChange={(value) => setPatientDetails(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger className="mt-1">
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
                  <Label htmlFor="bloodGroup">Blood Group *</Label>
                  <Select value={patientDetails.bloodGroup} onValueChange={(value) => setPatientDetails(prev => ({ ...prev, bloodGroup: value }))}>
                    <SelectTrigger className="mt-1">
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

                <div>
                  <Label htmlFor="language">Preferred Language *</Label>
                  <Select value={patientDetails.language} onValueChange={(value) => setPatientDetails(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">Hindi (हिंदी)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={startVideoCall} 
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 py-6 text-lg"
                disabled={!patientDetails.name || !patientDetails.age || !patientDetails.gender || !patientDetails.bloodGroup}
              >
                <Video className="h-5 w-5 mr-2" />
                Start AI Consultation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Header - Mobile Optimized */}
      <div className="bg-gray-800 p-3 md:p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700 min-w-[40px] h-[40px] p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm md:text-base truncate">AI Doctor Consultation</h2>
            <p className="text-xs md:text-sm text-gray-300 truncate">
              {patientDetails.name} • {patientDetails.age}y • {patientDetails.gender}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-green-400 text-sm">● Connected</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Video Section */}
        <div className="flex-1 relative bg-gray-800 flex items-center justify-center">
          {isCameraOn ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover rounded-lg shadow-2xl max-w-2xl max-h-96 lg:max-h-full"
              autoPlay
              muted
              playsInline
            />
          ) : (
            <div className="bg-gray-700 rounded-lg p-8 text-center max-w-md">
              <PersonalizedAIAvatar 
                patientDetails={patientDetails}
                isActive={hasStartedCall}
                doctorTone="friendly"
              />
              <h3 className="text-xl font-semibold mb-2 mt-4">Your AI Doctor</h3>
              <p className="text-gray-300 mb-4">Personalized consultation based on your profile</p>
              <Button onClick={startVideoCall} className="bg-blue-600 hover:bg-blue-700">
                <Camera className="h-4 w-4 mr-2" />
                Enable Camera
              </Button>
            </div>
          )}

          {/* Video Controls - Mobile Optimized */}
          <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 md:space-x-4">
            <Button
              onClick={() => setIsCameraOn(!isCameraOn)}
              className={`rounded-full min-w-[48px] min-h-[48px] md:w-14 md:h-14 p-3 shadow-lg ${isCameraOn ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isCameraOn ? <Video className="h-5 w-5 md:h-6 md:w-6" /> : <VideoOff className="h-5 w-5 md:h-6 md:w-6" />}
            </Button>
            <Button
              onClick={endConsultation}
              className="rounded-full min-w-[48px] min-h-[48px] md:w-14 md:h-14 p-3 bg-red-600 hover:bg-red-700 shadow-lg"
            >
              <Phone className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
          </div>
        </div>

        {/* Chat Section - Mobile Responsive */}
        <div className="w-full lg:w-96 bg-white text-gray-900 flex flex-col min-h-[40vh] lg:min-h-full">
          {/* Chat Header - Mobile */}
          <div className="lg:hidden bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Chat with AI Doctor</h3>
          </div>
          
          {/* Messages */}
          <div className="flex-1 p-3 md:p-4 overflow-y-auto space-y-3 md:space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <div className="flex items-start space-x-2">
                    {message.role === 'doctor' && <Bot className="h-4 w-4 mt-1 flex-shrink-0 text-blue-600" />}
                    {message.role === 'user' && <User2 className="h-4 w-4 mt-1 flex-shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.type === 'prescription' && message.prescription && (
                        <div className="mt-3 p-2 bg-blue-50 rounded border">
                          <p className="text-xs text-blue-800 font-medium">Prescription Generated</p>
                          <Button
                            size="sm"
                            onClick={() => setShowPrescription(true)}
                            className="mt-2 w-full"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View Prescription
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-blue-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Advanced Voice Recognition Section - Mobile Optimized */}
          <div className="p-3 md:p-4 border-t bg-gray-50">
            {detectedSymptoms.length > 0 && (
              <div className="mb-3">
                <Button
                  onClick={generatePrescription}
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 min-h-[44px]"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Prescription
                </Button>
              </div>
            )}
            
            {/* Advanced Voice Recognition Component */}
            <div className="mb-3 md:mb-4">
              <AdvancedVoiceRecognition
                onTranscript={handleVoiceTranscript}
                language={patientDetails.language}
                onLanguageChange={handleLanguageChange}
                isProcessing={isProcessing}
              />
            </div>
            
            {/* Text Input as Fallback - Mobile Friendly */}
            <div className="flex space-x-2">
              <Textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Type your symptoms here or use voice input above..."
                className="flex-1 resize-none text-base"
                rows={2}
                style={{ fontSize: '16px' }} // Prevents zoom on iOS
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!currentMessage.trim() || isProcessing}
                className="min-w-[44px] min-h-[44px] px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Modal */}
      {showPrescription && messages.find(m => m.type === 'prescription')?.prescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Medical Prescription</h3>
              <Button variant="ghost" onClick={() => setShowPrescription(false)}>×</Button>
            </div>
            <PrescriptionTemplate 
              prescription={messages.find(m => m.type === 'prescription')?.prescription}
            />
          </div>
        </div>
      )}
    </div>
  );
}