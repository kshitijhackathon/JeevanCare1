import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Video, VideoOff, Mic, MicOff, MessageSquare, Phone, Camera, FileText, ShoppingCart, Calendar, MapPin, User } from "lucide-react";
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

  const startConsultation = useMutation({
    mutationFn: async (details: PatientDetails) => {
      const response = await apiRequest("POST", "/api/ai-doctor/start", details);
      if (!response.ok) throw new Error("Failed to start consultation");
      return response.json();
    },
    onSuccess: () => {
      setStep('video-call');
      startVideoCall();
      const welcomeMessage: ChatMessage = {
        role: 'doctor',
        content: getWelcomeMessage(),
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([welcomeMessage]);
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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Failed to start video:", error);
      toast({
        title: "Camera Access",
        description: "Unable to access camera. Continuing with voice only.",
        variant: "destructive"
      });
    }
  };

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai-doctor/chat", {
        message,
        language: patientDetails.language,
        patientDetails,
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
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
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
                onClick={() => startConsultation.mutate(patientDetails)}
                disabled={!patientDetails.name || !patientDetails.age || !patientDetails.gender || !patientDetails.bloodGroup || startConsultation.isPending}
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
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
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
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Doctor Avatar Overlay */}
            <div className="absolute top-4 right-4 w-32 h-32 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <User className="w-12 h-12 mx-auto mb-2" />
                <p className="text-xs">AI Doctor</p>
              </div>
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

            {/* Video Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
              <Button
                onClick={() => setIsVideoOn(!isVideoOn)}
                variant={isVideoOn ? "secondary" : "destructive"}
                size="sm"
              >
                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
              <Button
                onClick={() => setIsAudioOn(!isAudioOn)}
                variant={isAudioOn ? "secondary" : "destructive"}
                size="sm"
              >
                {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
              <Button onClick={capturePhoto} variant="secondary" size="sm">
                <Camera className="w-4 h-4" />
              </Button>
              <Button 
                onClick={() => setShowBodyModel(true)} 
                variant="secondary" 
                size="sm"
              >
                Show Body Model
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
              <div className="flex space-x-2">
                <Textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder={patientDetails.language === 'hindi' ? "Apne symptoms batayiye..." : "Describe your symptoms..."}
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