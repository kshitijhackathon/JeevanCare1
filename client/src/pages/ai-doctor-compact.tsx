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
      
      setTimeout(() => {
        setIsTyping(false);
        
        const doctorMessage: ChatMessage = {
          text: data.response || data.instantAck || 'मैं समझ गया। कृपया और बताएं।',
          sender: 'doctor',
          timestamp: new Date().toLocaleTimeString()
        };
        
        setChatMessages(prev => [...prev, doctorMessage]);
        
        // Text-to-speech
        if (isAudioEnabled) {
          ttsEngine.speak({
            text: doctorMessage.text,
            language: selectedLanguage.code,
            gender: 'female',
            emotion: 'professional'
          }).catch(console.error);
        }
      }, 1000);

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

      {/* Mobile-First Chat Interface */}
      <div className="max-w-7xl mx-auto p-2 md:p-4">
        {/* Full Screen Chat with Doctor in Background */}
        <Card className="h-[calc(100vh-100px)] relative overflow-hidden">
          {/* Background Doctor Video - Behind Chat */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-green-900/20">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <div className="text-center">
                <div className="h-32 w-32 md:h-48 md:w-48 bg-gradient-to-br from-blue-500 to-green-500 rounded-full mx-auto flex items-center justify-center">
                  <User className="h-16 w-16 md:h-24 md:w-24 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Video Controls - Top Right */}
          <div className="absolute top-3 right-3 z-10 flex items-center space-x-2">
            <Button
              variant={isVideoOn ? "default" : "secondary"}
              size="sm"
              onClick={() => setIsVideoOn(!isVideoOn)}
              className="bg-black/50 backdrop-blur-sm border-white/20"
            >
              {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            
            <Button
              variant={isMuted ? "secondary" : "default"}
              size="sm"
              onClick={toggleMicrophone}
              className="bg-black/50 backdrop-blur-sm border-white/20"
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>

            <Button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              variant="outline"
              size="sm"
              className="bg-black/50 backdrop-blur-sm border-white/20"
            >
              {isAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>

          {/* Patient Video - Top Left */}
          <div className="absolute top-3 left-3 w-16 h-12 md:w-24 md:h-18 bg-gray-800 rounded border border-white/20 overflow-hidden z-10">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!isVideoOn && (
              <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                <User className="h-4 w-4 md:h-6 md:w-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Main Chat Interface */}
          <CardContent className="h-full flex flex-col p-3 md:p-4 relative z-20">
            {/* Chat Header */}
            <div className="flex items-center justify-between mb-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium text-sm">Dr. AI - Medical Chat</span>
              </div>
              <Badge variant="outline" className="text-xs">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                {selectedLanguage.native}
              </Badge>
            </div>

            {/* Messages Area - Full Screen Scrollable */}
            <div 
              className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3"
              style={{ minHeight: '0' }}
            >
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-md px-3 py-2 rounded-lg text-sm shadow-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/95 dark:bg-gray-800/95 text-gray-900 dark:text-white backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    <span className="text-xs opacity-70 block mt-1">
                      {message.timestamp}
                    </span>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
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
            <div className="space-y-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex space-x-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="अपने लक्षण बताएं... / Type your symptoms..."
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="flex-1 bg-white/90 dark:bg-gray-800/90"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!currentMessage.trim()}
                  size="sm"
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                onClick={toggleRecording}
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                className="w-full bg-white/90 dark:bg-gray-800/90"
              >
                {isRecording ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                {isRecording ? 'रिकॉर्डिंग बंद करें' : 'बोलकर बताएं'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompactAIDoctorConsultation;