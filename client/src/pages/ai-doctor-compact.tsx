import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ttsEngine } from "@/lib/tts-engine";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  ArrowLeft,
  User,
  MessageSquare,
  Clock,
  Activity,
  Stethoscope,
  Volume2,
  VolumeX,
  Send
} from "lucide-react";
import { Link } from "wouter";

// Indian languages
const INDIAN_LANGUAGES = [
  { code: 'eng_Latn', name: 'English', native: 'English' },
  { code: 'hin_Deva', name: 'Hindi', native: 'हिन्दी' },
];

interface ChatMessage {
  text: string;
  sender: 'user' | 'doctor';
  timestamp: string;
}

const CompactAIDoctorConsultation = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Video states
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      text: "नमस्ते! मैं Dr. AI हूँ। आपकी तबीयत कैसी है? अपने लक्षणों के बारे में बताएं।",
      sender: 'doctor',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice states
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  // Language and patient states
  const [selectedLanguage] = useState(INDIAN_LANGUAGES[1]); // Default to Hindi
  const [consultationTime, setConsultationTime] = useState('00:00:00');

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        console.log('Camera initialized successfully');
      } catch (error) {
        console.error('Camera initialization failed:', error);
      }
    };

    if (isVideoOn) {
      initCamera();
    }
  }, [isVideoOn]);

  // Timer for consultation
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      setConsultationTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      text: currentMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    try {
      // Fast response API call
      const response = await fetch('/api/fast-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentMessage }),
      });

      if (!response.ok) throw new Error('Response failed');

      const data = await response.json();
      
      setIsTyping(false);
      
      // Use actual response instead of instant ack
      let responseText = data.response || 'मैं समझ गया। कृपया और बताएं।';
      
      // If there's a follow-up question, add it
      if (data.followUp && data.followUp.trim()) {
        responseText += ' ' + data.followUp;
      }
      
      const doctorMessage: ChatMessage = {
        text: responseText,
        sender: 'doctor',
        timestamp: new Date().toLocaleTimeString()
      };
      
      setChatMessages(prev => [...prev, doctorMessage]);
      
      // Text-to-speech
      if (isAudioEnabled) {
        ttsEngine.speak({
          text: responseText,
          language: selectedLanguage.code,
          gender: 'female',
          emotion: 'professional'
        }).catch(console.error);
      }

    } catch (error) {
      console.error('Message failed:', error);
      setIsTyping(false);
      
      const fallbackMessage: ChatMessage = {
        text: 'मैं आपकी बात समझ गया। कृपया और विस्तार से बताएं।',
        sender: 'doctor',
        timestamp: new Date().toLocaleTimeString()
      };
      
      setChatMessages(prev => [...prev, fallbackMessage]);
    }
  };

  const toggleMicrophone = () => {
    setIsMuted(!isMuted);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      if ((window as any).currentRecognition) {
        (window as any).currentRecognition.stop();
      }
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = selectedLanguage.code === 'hin_Deva' ? 'hi-IN' : 'en-IN';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => {
          setIsRecording(true);
          toast({
            title: "Voice Recording",
            description: "Listening... Speak your symptoms.",
          });
        };
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setCurrentMessage(transcript);
          setIsRecording(false);
        };
        
        recognition.onerror = () => {
          setIsRecording(false);
          toast({
            title: "Voice Error",
            description: "Please try typing instead.",
            variant: "destructive"
          });
        };
        
        recognition.onend = () => {
          setIsRecording(false);
        };
        
        (window as any).currentRecognition = recognition;
        recognition.start();
        
      } else {
        toast({
          title: "Voice Not Supported",
          description: "Please type your message.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Microphone Permission Required",
        description: "Please allow microphone access.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      {/* Compact Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                  <Stethoscope className="h-3 w-3 text-white" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Dr. AI - Virtual Physician</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs">Online</span>
              </Badge>
              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300">
                <Clock className="h-3 w-3" />
                <span>{consultationTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="max-w-7xl mx-auto p-2 sm:p-4">
        <Card className="h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)] flex flex-col lg:flex-row">
          {/* Doctor Video Section - Mobile: Top, Desktop: Left */}
          <div className="w-full lg:w-80 lg:flex-shrink-0 lg:border-r border-b lg:border-b-0">
            <CardHeader className="pb-2 sm:pb-3 border-b">
              <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Video className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Video Call</span>
                  <span className="sm:hidden">Dr. AI</span>
                </div>
                
                {/* Video Controls */}
                <div className="flex items-center space-x-1">
                  <Button
                    variant={isVideoOn ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setIsVideoOn(!isVideoOn)}
                  >
                    {isVideoOn ? <Video className="h-3 w-3 sm:h-4 sm:w-4" /> : <VideoOff className="h-3 w-3 sm:h-4 sm:w-4" />}
                  </Button>
                  
                  <Button
                    variant={isMuted ? "secondary" : "default"}
                    size="sm"
                    onClick={toggleMicrophone}
                  >
                    {isMuted ? <MicOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Mic className="h-3 w-3 sm:h-4 sm:w-4" />}
                  </Button>

                  <Button
                    onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                    variant="outline"
                    size="sm"
                  >
                    {isAudioEnabled ? <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" /> : <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-2 sm:p-4">
              {/* Doctor Video Area - Responsive */}
              <div className="h-40 sm:h-48 lg:h-64 bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 rounded-lg relative overflow-hidden mb-2 sm:mb-4">
                {/* Virtual Doctor Avatar */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 bg-gradient-to-br from-blue-500 to-green-500 rounded-full mx-auto mb-1 sm:mb-2 flex items-center justify-center shadow-xl border-2 border-white/20">
                      <User className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white mb-1">Dr. AI</h3>
                    <p className="text-blue-200 text-xs sm:text-sm">Virtual Physician</p>
                    <div className="flex items-center justify-center space-x-1 text-green-300 mt-1 sm:mt-2">
                      <Activity className="h-2 w-2 sm:h-3 sm:w-3 animate-pulse" />
                      <span className="text-xs">Available</span>
                    </div>
                  </div>
                </div>

                {/* Patient Video (Picture-in-Picture) */}
                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-16 h-12 sm:w-20 sm:h-16 bg-gray-800 rounded border border-white/20 overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!isVideoOn && (
                    <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                      <User className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Language and Status - Hidden on mobile to save space */}
              <div className="hidden lg:block space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Language:</span>
                  <span className="font-medium">{selectedLanguage.native}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="text-green-600 font-medium">Connected</span>
                </div>
              </div>
            </CardContent>
          </div>

          {/* Chat Interface - Mobile: Bottom, Desktop: Right (Scrollable) */}
          <div className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-2 sm:pb-3 border-b">
              <CardTitle className="text-base sm:text-lg flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Medical Consultation Chat</span>
                <span className="sm:hidden">Chat</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-2 sm:p-4 min-h-0">
              {/* Messages Area - Scrollable */}
              <div 
                className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 pr-1 sm:pr-2 mb-3 sm:mb-4"
                style={{ minHeight: '0' }}
              >
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.text}</p>
                      <span className="text-xs opacity-70 block mt-1">
                        {message.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 dark:bg-gray-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area - Fixed at bottom */}
              <div className="space-y-2 sm:space-y-3 border-t pt-3 sm:pt-4">
                <div className="flex space-x-2">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="अपने लक्षण बताएं..."
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!currentMessage.trim()}
                    size="sm"
                  >
                    <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={toggleRecording}
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    className="flex-1 text-xs sm:text-sm"
                  >
                    {isRecording ? <MicOff className="h-3 w-3 sm:h-4 sm:w-4 mr-2" /> : <Mic className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />}
                    {isRecording ? 'रिकॉर्डिंग बंद करें' : 'बोलकर बताएं'}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      const endMessage = selectedLanguage.code === 'hin_Deva' ? 'धन्यवाद' : 'Thank you';
                      setCurrentMessage(endMessage);
                      sendMessage();
                    }}
                    variant="secondary"
                    size="sm"
                    className="text-xs sm:text-sm px-3"
                  >
                    {selectedLanguage.code === 'hin_Deva' ? 'समाप्त' : 'End'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CompactAIDoctorConsultation;