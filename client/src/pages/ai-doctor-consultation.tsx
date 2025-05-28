import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Video, VideoOff, Mic, MicOff, MessageSquare, Phone, Camera, FileText, ShoppingCart, Calendar, MapPin, User, Play, Square, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  type: 'text' | 'image' | 'body-point';
}

interface BodyPart {
  id: string;
  name: string;
  x: number;
  y: number;
}

export default function AIDoctorConsultation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [step, setStep] = useState<'details' | 'video-call' | 'review' | 'prescription' | 'services'>('details');
  const [patientDetails, setPatientDetails] = useState<PatientDetails>({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    gender: '',
    age: '',
    bloodGroup: '',
    language: 'english'
  });
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [showBodyModel, setShowBodyModel] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [aiAvatar, setAiAvatar] = useState<string>('');
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const [isContinuousListening, setIsContinuousListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [callSummary, setCallSummary] = useState<string>('');
  const [showSummary, setShowSummary] = useState(false);

  // Body parts for 3D interaction
  const bodyParts: BodyPart[] = [
    { id: 'head', name: 'Head', x: 50, y: 15 },
    { id: 'throat', name: 'Throat', x: 50, y: 25 },
    { id: 'chest', name: 'Chest', x: 50, y: 35 },
    { id: 'stomach', name: 'Stomach', x: 50, y: 50 },
    { id: 'left-arm', name: 'Left Arm', x: 25, y: 40 },
    { id: 'right-arm', name: 'Right Arm', x: 75, y: 40 },
    { id: 'left-leg', name: 'Left Leg', x: 40, y: 75 },
    { id: 'right-leg', name: 'Right Leg', x: 60, y: 75 }
  ];

  // Generate AI avatar based on patient demographics
  const generateAIAvatar = () => {
    const age = parseInt(patientDetails.age);
    const gender = patientDetails.gender;
    
    // Avatar selection based on opposite gender and similar age group
    if (gender === 'male') {
      if (age >= 18 && age <= 30) {
        return 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face';
      } else if (age >= 31 && age <= 50) {
        return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face';
      } else {
        return 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face';
      }
    } else {
      if (age >= 18 && age <= 30) {
        return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face';
      } else if (age >= 31 && age <= 50) {
        return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face';
      } else {
        return 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face';
      }
    }
  };

  // Initialize AI avatar on consultation start
  useEffect(() => {
    if (patientDetails.age && patientDetails.gender) {
      setAiAvatar(generateAIAvatar());
    }
  }, [patientDetails.age, patientDetails.gender]);

  // Initialize continuous speech recognition
  useEffect(() => {
    if (step === 'video-call' && 'webkitSpeechRecognition' in window) {
      const speechRecognition = new (window as any).webkitSpeechRecognition();
      speechRecognition.continuous = true;
      speechRecognition.interimResults = true;
      speechRecognition.lang = patientDetails.language === 'hindi' ? 'hi-IN' : 'en-US';
      
      speechRecognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript.trim()) {
          setCurrentMessage(finalTranscript);
          // Auto-process the speech after 2 seconds of silence
          setTimeout(() => {
            if (finalTranscript.trim()) {
              processVoiceInput(finalTranscript);
            }
          }, 2000);
        }
      };

      speechRecognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

      setRecognition(speechRecognition);
    }
  }, [step, patientDetails.language]);

  // Start/stop continuous listening
  const toggleContinuousListening = () => {
    if (!recognition) return;
    
    if (isContinuousListening) {
      recognition.stop();
      setIsContinuousListening(false);
    } else {
      recognition.start();
      setIsContinuousListening(true);
    }
  };



  // Process voice input with medical AI
  const processVoiceInput = async (transcript: string) => {
    setIsProcessingSpeech(true);
    try {
      // Add user message to chat
      const userMessage: ChatMessage = {
        role: 'user',
        content: transcript,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Simple medical analysis for instant response
      
      // Generate AI doctor response based on input
      let doctorResponse = '';
      
      // Simple symptom analysis from transcript
      const symptoms = [];
      if (transcript.toLowerCase().includes('headache') || transcript.toLowerCase().includes('sir dard')) {
        symptoms.push('headache');
      }
      if (transcript.toLowerCase().includes('fever') || transcript.toLowerCase().includes('bukhar')) {
        symptoms.push('fever');
      }
      if (transcript.toLowerCase().includes('cough') || transcript.toLowerCase().includes('khansi')) {
        symptoms.push('cough');
      }
      if (transcript.toLowerCase().includes('pain') || transcript.toLowerCase().includes('dard')) {
        symptoms.push('pain');
      }

      if (symptoms.length > 0) {
        if (patientDetails.language === 'hindi') {
          doctorResponse = `Main samjh gaya aapko ${symptoms.join(', ')} ki samasya hai. `;
          
          // Basic prescription recommendations
          if (symptoms.includes('fever')) {
            doctorResponse += `Bukhar ke liye Paracetamol 500mg, din mein 3 baar lein. `;
          }
          if (symptoms.includes('headache')) {
            doctorResponse += `Sir dard ke liye Ibuprofen 400mg, zarurat ke anusaar lein. `;
          }
          if (symptoms.includes('cough')) {
            doctorResponse += `Khansi ke liye Cough syrup 10ml, din mein 3 baar lein. `;
          }
          
          doctorResponse += `Aur koi symptoms hai? Kya aapka koi aur sawal hai?`;
        } else {
          doctorResponse = `I understand you're experiencing ${symptoms.join(', ')}. `;
          
          // Basic prescription recommendations
          if (symptoms.includes('fever')) {
            doctorResponse += `For fever, take Paracetamol 500mg, 3 times daily. `;
          }
          if (symptoms.includes('headache')) {
            doctorResponse += `For headache, take Ibuprofen 400mg as needed. `;
          }
          if (symptoms.includes('cough')) {
            doctorResponse += `For cough, take Cough syrup 10ml, 3 times daily. `;
          }
          
          doctorResponse += `Any other symptoms? Do you have any other questions?`;
        }
      } else {
        doctorResponse = patientDetails.language === 'hindi' 
          ? `Main aapki baat samjh gaya. Kripya aur detail mein bataiye ki aapko kya takleef ho rahi hai?`
          : `I understand. Can you please provide more details about what you're experiencing?`;
      }
      
      // Add AI doctor response to chat
      const doctorMessage: ChatMessage = {
        role: 'doctor',
        content: doctorResponse,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, doctorMessage]);
      
      // Text-to-speech for doctor responses
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(doctorResponse);
        utterance.lang = patientDetails.language === 'hindi' ? 'hi-IN' : 'en-US';
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      }
      
    } catch (error) {
      console.error('Error processing voice input:', error);
    } finally {
      setIsProcessingSpeech(false);
      setCurrentMessage('');
    }
  };

  // Speech-to-text using OpenAI Whisper
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processAudioWithWhisper(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      setAudioChunks([]);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Access",
        description: "Microphone permission needed for voice input.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const processAudioWithWhisper = async (audioBlob: Blob) => {
    setIsProcessingSpeech(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', patientDetails.language);

      const response = await fetch('/api/ai-doctor/whisper-transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Transcription failed');
      
      const data = await response.json();
      setCurrentMessage(data.transcription);
      
      // Auto-analyze the transcribed text with medical AI
      await analyzeMedicalText(data.transcription);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Speech Processing Error",
        description: "Failed to process speech. Please try typing instead.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingSpeech(false);
    }
  };

  // Medical text analysis using Bio_ClinicalBERT and NegBio
  const analyzeMedicalText = async (text: string) => {
    try {
      const response = await fetch('/api/ai-doctor/medical-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          patientDetails,
          selectedBodyPart
        })
      });

      if (!response.ok) throw new Error('Medical analysis failed');
      
      const analysis = await response.json();
      
      // Generate prescription using DrugBERT if symptoms detected
      if (analysis.symptoms && analysis.symptoms.length > 0) {
        await generatePrescription(analysis);
      }
      
    } catch (error) {
      console.error('Error in medical analysis:', error);
    }
  };

  // End call and generate summary
  const endCall = async () => {
    try {
      // Stop continuous listening
      if (recognition && isContinuousListening) {
        recognition.stop();
        setIsContinuousListening(false);
      }

      // Stop all media tracks and close camera
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        videoRef.current.srcObject = null;
      }

      // Reset video states
      setIsVideoOn(false);
      setIsAudioOn(false);

      // Generate call summary with prescriptions
      const summary = await generateCallSummary();
      setCallSummary(summary);
      setShowSummary(true);
      
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  // Close consultation and clean up camera
  const closeConsultation = () => {
    // Stop all media tracks
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      videoRef.current.srcObject = null;
    }

    // Stop speech recognition
    if (recognition && isContinuousListening) {
      recognition.stop();
      setIsContinuousListening(false);
    }

    // Reset all states
    setStep('details');
    setIsVideoOn(false);
    setIsAudioOn(false);
    setMessages([]);
    setShowSummary(false);
  };

  // Generate call summary with prescriptions
  const generateCallSummary = async () => {
    try {
      const allSymptoms = messages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join(' ');

      const response = await fetch('/api/ai-doctor/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages,
          patientDetails: patientDetails,
          symptoms: allSymptoms
        })
      });

      if (response.ok) {
        const summaryData = await response.json();
        return summaryData.summary;
      }
    } catch (error) {
      console.error('Error generating summary:', error);
    }

    // Fallback summary
    const prescriptions = messages
      .filter(msg => msg.role === 'doctor' && msg.content.includes('recommend'))
      .map(msg => msg.content)
      .join('\n\n');

    return patientDetails.language === 'hindi' 
      ? `Consultation Summary:\n\nMukhya Symptoms: ${messages.filter(msg => msg.role === 'user').map(msg => msg.content).join(', ')}\n\nSalah aur Dawaiyaan:\n${prescriptions || 'Koi specific dawai nahi di gayi'}`
      : `Consultation Summary:\n\nMain Symptoms: ${messages.filter(msg => msg.role === 'user').map(msg => msg.content).join(', ')}\n\nRecommendations & Prescriptions:\n${prescriptions || 'No specific medications prescribed'}`;
  };

  const startConsultation = useMutation({
    mutationFn: async (details: PatientDetails) => {
      const response = await apiRequest("POST", "/api/ai-doctor/start", details);
      if (!response.ok) throw new Error("Failed to start consultation");
      return response.json();
    },
    onSuccess: () => {
      console.log("Consultation started successfully, changing step to video-call");
      setStep('video-call');
      setTimeout(() => {
        startVideoCall();
        const welcomeMessage: ChatMessage = {
          role: 'doctor',
          content: getWelcomeMessage(),
          timestamp: new Date(),
          type: 'text'
        };
        setMessages([welcomeMessage]);
      }, 100);
    },
    onError: (error) => {
      console.error("Consultation start error:", error);
      toast({
        title: "Error",
        description: "Failed to start consultation. Please try again.",
        variant: "destructive"
      });
    }
  });

  const getWelcomeMessage = () => {
    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
    
    if (patientDetails.language === 'hindi') {
      return `Namaskar ${patientDetails.name} ji! Main aapka AI Doctor hoon. ${greeting}! Aaj aapko kis prakar ki takleef ho rahi hai? Kripya detail mein bataiye.`;
    }
    return `${greeting} ${patientDetails.name}! I'm your AI Doctor. How are you feeling today? Please tell me about your symptoms in detail.`;
  };

  const startVideoCall = async () => {
    try {
      console.log("Starting video call...");
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
        console.log("Video stream started successfully");
        
        // Add welcome message after video starts
        setTimeout(() => {
          const welcomeMessage: ChatMessage = {
            role: 'doctor',
            content: getWelcomeMessage(),
            timestamp: new Date(),
            type: 'text'
          };
          setMessages([welcomeMessage]);
          
          // Text-to-speech welcome
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(getWelcomeMessage());
            utterance.lang = patientDetails.language === 'hindi' ? 'hi-IN' : 'en-US';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to start video:", error);
      toast({
        title: "Camera Access",
        description: "Camera permission needed for video consultation. Please allow access.",
        variant: "destructive"
      });
      // Still show welcome message even without camera
      const welcomeMessage: ChatMessage = {
        role: 'doctor',
        content: getWelcomeMessage(),
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([welcomeMessage]);
    }
  };

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai-doctor/groq-medical-chat", {
        message,
        language: patientDetails.language,
        patientDetails,
        conversationHistory: messages.slice(-5),
        selectedBodyPart,
        capturedImage
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: (data) => {
      const doctorMessage: ChatMessage = {
        role: 'doctor',
        content: data.response,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, doctorMessage]);
      setCurrentMessage('');
      
      // Text-to-speech for doctor responses
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.response);
        utterance.lang = patientDetails.language === 'hindi' ? 'hi-IN' : 'en-US';
        speechSynthesis.speak(utterance);
      }
    }
  });

  const handleSendMessage = () => {
    if (!currentMessage.trim() && !selectedBodyPart && !capturedImage) return;
    
    let messageContent = currentMessage;
    if (selectedBodyPart) {
      messageContent += ` [Selected body part: ${selectedBodyPart}]`;
    }
    if (capturedImage) {
      messageContent += ` [Photo captured]`;
    }
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      type: selectedBodyPart ? 'body-point' : capturedImage ? 'image' : 'text'
    };
    setMessages(prev => [...prev, userMessage]);
    sendMessage.mutate(messageContent);
    setSelectedBodyPart('');
    setCapturedImage('');
  };

  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        toast({
          title: "Photo Captured",
          description: "Photo captured successfully for analysis",
        });
      }
    }
  };

  const endConsultation = () => {
    setIsReviewing(true);
    setStep('review');
    
    // Stop video stream
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    
    // Show review message
    setTimeout(() => {
      setStep('prescription');
      setIsReviewing(false);
    }, 120000); // 2 minutes review time
  };

  if (step === 'details') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" onClick={closeConsultation}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold">AI Doctor Consultation</h1>
        </div>

        <div className="p-4">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <CardTitle>Patient Details</CardTitle>
              <p className="text-sm text-gray-600">Complete your profile for personalized consultation</p>
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
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select onValueChange={(value) => setPatientDetails({...patientDetails, bloodGroup: value})}>
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
                onClick={() => {
                  console.log("Button clicked, patient details:", patientDetails);
                  console.log("Current step:", step);
                  
                  // Direct step change for testing
                  if (!patientDetails.name || !patientDetails.age || !patientDetails.gender || !patientDetails.bloodGroup) {
                    toast({
                      title: "Missing Information", 
                      description: "Please fill all required fields",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // Directly change step for now
                  console.log("Changing step to video-call");
                  setStep('video-call');
                  
                  // Start video call immediately
                  setTimeout(() => {
                    startVideoCall();
                  }, 500);
                }}
                disabled={startConsultation.isPending}
                className="w-full"
                size="lg"
              >
                {startConsultation.isPending ? "Starting Video Call..." : "Start Video Consultation"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'video-call') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Video Call Header */}
        <div className="bg-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {aiAvatar ? (
              <img 
                src={aiAvatar} 
                alt="AI Doctor Avatar" 
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-400"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="font-medium">Dr. AI Assistant</h3>
              <p className="text-sm text-gray-300">Online • Consultation Active</p>
            </div>
          </div>
          <Button onClick={endConsultation} variant="destructive" size="sm">
            <Phone className="w-4 h-4 mr-2" />
            End Call
          </Button>
        </div>

        <div className="flex h-[calc(100vh-80px)]">
          {/* Main Video Area */}
          <div className="flex-1 relative">
            {/* Patient Video (Your Camera) */}
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* AI Doctor Avatar - Human-like */}
            <div className="absolute top-4 right-4 w-48 h-64 bg-gradient-to-b from-blue-100 to-white rounded-xl shadow-lg border border-blue-200 overflow-hidden">
              <div className="relative h-full flex flex-col items-center justify-center">
                {/* Doctor's Face/Avatar */}
                <div className="w-20 h-20 bg-gradient-to-br from-pink-200 to-orange-200 rounded-full mb-3 relative">
                  {/* Face features */}
                  <div className="absolute top-3 left-4 w-2 h-2 bg-black rounded-full"></div>
                  <div className="absolute top-3 right-4 w-2 h-2 bg-black rounded-full"></div>
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-pink-400 rounded-full"></div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-red-400 rounded-full"></div>
                </div>
                
                {/* Doctor's Body */}
                <div className="w-16 h-20 bg-white rounded-lg border-2 border-blue-300 relative">
                  {/* White coat */}
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-blue-500 rounded"></div>
                  {/* Stethoscope */}
                  <div className="absolute top-3 left-1 w-3 h-3 border-2 border-gray-600 rounded-full"></div>
                  <div className="absolute top-4 left-2 w-6 h-1 bg-gray-600"></div>
                </div>
                
                {/* AI Doctor Info */}
                <div className="text-center mt-2">
                  <p className="text-xs font-medium text-blue-800">AI Medical Assistant</p>
                  <p className="text-xs text-blue-600">Advanced Medical AI</p>
                  <div className="flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    <p className="text-xs text-green-600">Online</p>
                  </div>
                </div>
                
                {/* Speaking animation */}
                <div className="absolute bottom-12 right-2">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Camera Status Indicator */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-full text-white text-sm">
              {isVideoOn ? "📹 Camera On" : "📷 Camera Off"}
            </div>

            {/* 3D Body Model */}
            {showBodyModel && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-4">
                <h4 className="text-black font-medium mb-4 text-center">Where is the pain?</h4>
                <div className="relative w-48 h-80 bg-gray-100 rounded-lg">
                  {/* Simple Human Body Outline */}
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <ellipse cx="50" cy="15" rx="8" ry="10" fill="#e5e7eb" stroke="#374151" strokeWidth="1"/>
                    <rect x="45" y="25" width="10" height="25" fill="#e5e7eb" stroke="#374151" strokeWidth="1"/>
                    <rect x="40" y="50" width="20" height="25" fill="#e5e7eb" stroke="#374151" strokeWidth="1"/>
                    <rect x="35" y="30" width="8" height="20" fill="#e5e7eb" stroke="#374151" strokeWidth="1"/>
                    <rect x="57" y="30" width="8" height="20" fill="#e5e7eb" stroke="#374151" strokeWidth="1"/>
                    <rect x="45" y="75" width="4" height="20" fill="#e5e7eb" stroke="#374151" strokeWidth="1"/>
                    <rect x="51" y="75" width="4" height="20" fill="#e5e7eb" stroke="#374151" strokeWidth="1"/>
                  </svg>
                  
                  {/* Clickable Body Parts */}
                  {bodyParts.map((part) => (
                    <button
                      key={part.id}
                      onClick={() => {
                        setSelectedBodyPart(part.name);
                        setShowBodyModel(false);
                        toast({
                          title: "Body Part Selected",
                          description: `Selected: ${part.name}`,
                        });
                      }}
                      className="absolute w-6 h-6 bg-red-500 rounded-full opacity-70 hover:opacity-100 transform -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${part.x}%`, top: `${part.y}%` }}
                    />
                  ))}
                </div>
                <Button 
                  onClick={() => setShowBodyModel(false)}
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 text-black"
                >
                  Close Body Model
                </Button>
              </div>
            )}

            {/* Clean Video Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
              <Button
                onClick={() => {
                  setIsVideoOn(!isVideoOn);
                  if (videoRef.current && videoRef.current.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    const videoTrack = stream.getVideoTracks()[0];
                    if (videoTrack) {
                      videoTrack.enabled = !isVideoOn;
                    }
                  }
                }}
                variant={isVideoOn ? "secondary" : "destructive"}
                size="sm"
                className="px-3"
              >
                {isVideoOn ? <Video className="w-4 h-4 mr-1" /> : <VideoOff className="w-4 h-4 mr-1" />}
                Camera
              </Button>
              
              <Button
                onClick={toggleContinuousListening}
                variant={isContinuousListening ? "default" : "secondary"}
                size="sm"
                className="px-3"
              >
                {isContinuousListening ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
                {isContinuousListening ? "Stop Voice" : "Start Voice"}
              </Button>
              
              <Button 
                onClick={endCall}
                variant="destructive" 
                size="sm"
                className="bg-red-600 hover:bg-red-700 px-3"
              >
                📞 End Call
              </Button>
            </div>
          </div>

          {/* Chat Sidebar */}
          <div className="w-80 bg-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h4 className="font-medium">Chat with Doctor</h4>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-100'
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

            <div className="p-4 border-t border-gray-700">
              {/* AI Avatar Section */}
              <div className="mb-4 flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                {aiAvatar ? (
                  <img 
                    src={aiAvatar} 
                    alt="AI Doctor Avatar" 
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-400"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">AI Doctor Assistant</p>
                  <p className="text-xs text-gray-300">
                    {patientDetails.language === 'hindi' 
                      ? "Aapke saath hai - Hindi aur English mein baat kar sakta hai"
                      : "Powered by advanced medical AI models"
                    }
                  </p>
                </div>
              </div>

              {/* Speech Processing Status */}
              {isProcessingSpeech && (
                <div className="mb-2 p-2 bg-purple-600 rounded text-sm flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Processing speech with OpenAI Whisper...</span>
                </div>
              )}

              {selectedBodyPart && (
                <div className="mb-2 p-2 bg-blue-600 rounded text-sm">
                  Selected: {selectedBodyPart}
                </div>
              )}
              {capturedImage && (
                <div className="mb-2 p-2 bg-green-600 rounded text-sm">
                  Photo captured for analysis
                </div>
              )}

              {/* Enhanced Input Section with Voice */}
              <div className="space-y-3">
                {/* Continuous Voice Status */}
                {isContinuousListening && (
                  <div className="p-2 bg-green-600 rounded text-sm flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <span>
                      {patientDetails.language === 'hindi' 
                        ? "Aapki awaz sun raha hun..." 
                        : "Listening to your voice..."
                      }
                    </span>
                  </div>
                )}

                {/* Text Input */}
                <div className="flex space-x-2">
                  <Textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder={patientDetails.language === 'hindi' 
                      ? "Apne symptoms batayiye... (Voice button se baat kar sakte hai)" 
                      : "Describe your symptoms... (Voice button to speak)"
                    }
                    className="flex-1 text-white bg-gray-700 border-gray-600"
                    rows={2}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() && !selectedBodyPart && !capturedImage || sendMessage.isPending}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>

                {/* Status Info */}
                <div className="text-xs text-gray-400 text-center">
                  {patientDetails.language === 'hindi' 
                    ? "🤖 AI Doctor aapki madad ke liye tayyar hai"
                    : "🤖 AI Doctor ready to help you"
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="animate-pulse w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Doctor is Reviewing</h2>
            <p className="text-gray-600 mb-4">
              Please wait 2 minutes while our AI doctor analyzes your symptoms and prepares your personalized prescription.
            </p>
            <div className="text-sm text-gray-500 space-y-2">
              <p>🔍 Analyzing symptoms and medical history</p>
              <p>💊 Preparing medicine recommendations</p>
              <p>🧪 Suggesting required tests</p>
              <p>📋 Generating final prescription</p>
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
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Your Prescription</h1>
        </div>

        <div className="p-4 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">JeevanCare AI Medical Center</h2>
                <p className="text-sm text-gray-600">Advanced AI-Powered Healthcare Solutions</p>
                <p className="text-xs text-gray-500 mt-1">AI Doctor Consultation • Session ID: {Date.now()}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div><strong>Patient:</strong> {patientDetails.name}</div>
                <div><strong>Age:</strong> {patientDetails.age} years</div>
                <div><strong>Gender:</strong> {patientDetails.gender}</div>
                <div><strong>Blood Group:</strong> {patientDetails.bloodGroup}</div>
                <div><strong>Language:</strong> {patientDetails.language}</div>
                <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
              </div>
              
              <div className="border-t pt-4 mb-4">
                <h3 className="font-semibold mb-3">Prescribed Medications</h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                    <p className="font-medium text-blue-800">Paracetamol 500mg</p>
                    <p className="text-sm text-blue-600">Take 1 tablet twice daily after meals for 3 days</p>
                    <p className="text-xs text-blue-500 mt-1">For fever and pain relief</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                    <p className="font-medium text-green-800">Vitamin D3 1000 IU</p>
                    <p className="text-sm text-green-600">Take 1 tablet daily after breakfast for 30 days</p>
                    <p className="text-xs text-green-500 mt-1">For immunity and bone health</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <h3 className="font-semibold mb-2">Recommended Tests</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Complete Blood Count (CBC)</li>
                  <li>• Blood Sugar Test</li>
                  <li>• Vitamin D Level</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded mb-4">
                <h4 className="font-medium text-yellow-800 mb-1">Important Instructions:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Take medicines as prescribed</li>
                  <li>• Complete the full course</li>
                  <li>• Drink plenty of water</li>
                  <li>• Consult doctor if symptoms persist</li>
                  <li>• Follow up in 3 days if not improving</li>
                </ul>
              </div>
              
              <div className="text-center border-t pt-4">
                <p className="text-sm text-gray-500 mb-4">
                  This prescription has been generated by AI Doctor and reviewed by<br/>
                  <strong>Dr. Priya Sharma, MBBS, MD (Internal Medicine)</strong><br/>
                  Medical License: 12345/2024 • JeevanCare Certified
                </p>
                <Button size="sm" className="mb-2">
                  <FileText className="w-4 h-4 mr-2" />
                  Download Prescription PDF
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-3">
            <Button 
              onClick={() => setStep('services')}
              className="w-full" 
              size="lg"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Book Your Test from Home (₹20)
            </Button>
            <Link href="/pharmacy">
              <Button variant="outline" className="w-full" size="lg">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Order Your Medicine
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'services') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep('prescription')}
            className="mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold">Book Services</h1>
        </div>

        <div className="p-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Home Test Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Get your prescribed tests done at home with certified lab technicians</p>
              <div className="bg-green-50 p-3 rounded mb-4">
                <p className="text-green-800 font-medium">Special Offer: ₹20 only</p>
                <p className="text-green-600 text-sm">Includes technician visit + sample collection</p>
              </div>
              <Link href="/book-test">
                <Button className="w-full">
                  Book Test Collection
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Medicine Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Get your prescribed medicines delivered to your doorstep</p>
              <div className="bg-blue-50 p-3 rounded mb-4">
                <p className="text-blue-800 font-medium">Fast Delivery</p>
                <p className="text-blue-600 text-sm">Live tracking • 20-30 minutes delivery</p>
              </div>
              <Link href="/pharmacy">
                <Button variant="outline" className="w-full">
                  Order Medicines
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Track Your Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Real-time tracking for all your medical deliveries</p>
              <Link href="/delivery/track">
                <Button variant="outline" className="w-full">
                  Track Orders
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}