import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Bot, 
  User, 
  Send, 
  Mic, 
  MicOff, 
  Brain, 
  CheckCircle, 
  FileText 
} from "lucide-react";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'recommendation';
}

interface MedicalHistory {
  conditions: string[];
  medications: string[];
  allergies: string[];
}

export default function AIConsultation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's medical history
  const { data: userHistory } = useQuery<MedicalHistory>({
    queryKey: ["/api/medical-history"],
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear loading state when messages update
  useEffect(() => {
    setIsLoading(false);
  }, [messages]);

  // AI consultation mutation
  const consultationMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/ai-consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: messages,
          medicalHistory: userHistory
        }),
      });
      
      if (!response.ok) {
        throw new Error('AI consultation failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        type: data.type || 'text'
      };
      setMessages(prev => [...prev, aiMessage]);
      
      if (data.diagnosis) {
        saveDiagnosis(data.diagnosis, data.recommendations);
      }
    },
    onError: (error) => {
      toast({
        title: "AI Consultation Error",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    }
  });

  const saveDiagnosis = async (diagnosis: string, recommendations: string[]) => {
    try {
      await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms: messages.filter(m => m.role === 'user').map(m => m.content).join('; '),
          diagnosis,
          recommendations,
          chatHistory: messages
        }),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/consultations'] });
    } catch (error) {
      console.error('Failed to save diagnosis:', error);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    consultationMutation.mutate(inputMessage);
    setInputMessage("");
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    // Voice recording implementation would go here
    setTimeout(() => {
      setIsRecording(false);
      setInputMessage("Voice input recorded");
    }, 3000);
  };

  useEffect(() => {
    // Welcome message
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `Hello! I'm your AI Health Assistant. I can help analyze your symptoms and provide medical guidance.

${userHistory?.conditions.length ? `I see you have a history of: ${userHistory.conditions.join(', ')}. ` : ''}

Please describe your current symptoms or health concerns, and I'll provide personalized recommendations.

**Note:** This is for informational purposes only and doesn't replace professional medical advice.`,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([welcomeMessage]);
    }
  }, [userHistory]);

  const getMessageIcon = (role: string, type?: string) => {
    if (role === 'assistant') {
      if (type === 'analysis') return <Brain className="w-5 h-5 text-blue-600" />;
      if (type === 'recommendation') return <CheckCircle className="w-5 h-5 text-green-600" />;
      return <Bot className="w-5 h-5 text-blue-600" />;
    }
    return <User className="w-5 h-5 text-gray-600" />;
  };

  return (
    <div className="mobile-container bg-gray-50 h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">AI Health Consultation</h1>
        </div>
      </div>

      {/* Medical History Context */}
      {userHistory && (userHistory.conditions.length > 0 || userHistory.medications.length > 0) && (
        <div className="p-4 bg-blue-50 border-b flex-shrink-0">
          <div className="text-sm">
            <h3 className="font-medium text-blue-900 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              Your Medical Context
            </h3>
            <div className="space-y-1">
              {userHistory.conditions.length > 0 && (
                <p className="text-blue-800">
                  <span className="font-medium">Conditions:</span> {userHistory.conditions.join(', ')}
                </p>
              )}
              {userHistory.medications.length > 0 && (
                <p className="text-blue-800">
                  <span className="font-medium">Medications:</span> {userHistory.medications.join(', ')}
                </p>
              )}
              {userHistory.allergies.length > 0 && (
                <p className="text-red-800">
                  <span className="font-medium">Allergies:</span> {userHistory.allergies.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Chat Messages Container */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-container">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex space-x-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {getMessageIcon(message.role, message.type)}
                </div>
              )}
              
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'analysis'
                    ? 'bg-blue-50 border border-blue-200'
                    : message.type === 'recommendation'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-75 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white">
                  {getMessageIcon(message.role)}
                </div>
              )}
            </div>
          ))}
        
          {isLoading && (
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t flex-shrink-0">
        <div className="flex space-x-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Describe your symptoms or health concerns..."
            className="flex-1 min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="flex flex-col space-y-2">
            <Button
              onClick={isRecording ? () => setIsRecording(false) : startVoiceRecording}
              variant="outline"
              size="sm"
              className={isRecording ? 'bg-red-50 border-red-200' : ''}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <p>Press Enter to send, Shift+Enter for new line</p>
          {isRecording && (
            <div className="flex items-center space-x-1 text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Recording...</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 bg-gray-50 border-t flex-shrink-0">
        <div className="flex space-x-2 overflow-x-auto">
          <Button variant="outline" size="sm" onClick={() => setInputMessage("I have a headache and feel tired")}>
            Headache & Fatigue
          </Button>
          <Button variant="outline" size="sm" onClick={() => setInputMessage("I have fever and cold symptoms")}>
            Fever & Cold
          </Button>
          <Button variant="outline" size="sm" onClick={() => setInputMessage("I'm experiencing stomach pain")}>
            Stomach Issues
          </Button>
          <Button variant="outline" size="sm" onClick={() => setInputMessage("I need a general health checkup advice")}>
            General Checkup
          </Button>
        </div>
      </div>
    </div>
  );
}