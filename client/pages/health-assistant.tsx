import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft,
  Send,
  Bot,
  User,
  Mic,
  MicOff,
  Sparkles,
  HelpCircle,
  Navigation,
  FileText,
  Stethoscope,
  Camera,
  MapPin,
  Pill,
  Calendar,
  Shield,
  Globe
} from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'navigation';
  suggestions?: string[];
  actions?: { label: string; route: string; icon: string }[];
}

export default function HealthAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Groq AI chat mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/health-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: messages.slice(-5) // Last 5 messages for context
        }),
      });
      
      if (!response.ok) {
        throw new Error('AI assistant failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        type: data.type || 'text',
        suggestions: data.suggestions,
        actions: data.actions
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      toast({
        title: "Assistant Error",
        description: "I'm having trouble responding. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    chatMutation.mutate(inputMessage);
    setInputMessage("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const startVoiceRecording = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        toast({
          title: "Voice Recognition Error",
          description: "Please try typing instead",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } else {
      toast({
        title: "Voice Not Supported",
        description: "Please type your question",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setIsLoading(false);
  }, [messages]);

  useEffect(() => {
    // Welcome message
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `Hello! I'm your intelligent healthcare assistant. I can help you navigate our health platform and answer questions about:

🏥 **Medical Services**
• AI consultations and symptom analysis
• Doctor appointments and specialist matching
• Medical record management
• Face scanning for health analysis

🌍 **Global Health Information**
• Disease tracking and prevention
• Health trends and statistics
• Regional health data

📋 **Personalized Guidance**
• Feature recommendations based on your needs
• Step-by-step guidance through health processes
• Quick access to emergency services

What would you like to know or do today?`,
        timestamp: new Date(),
        type: 'suggestion',
        suggestions: [
          "I have symptoms and need help",
          "How do I upload medical records?",
          "Find doctors near me",
          "Check global health trends",
          "Emergency services",
          "Book a health test"
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const getActionIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      'stethoscope': Stethoscope,
      'file': FileText,
      'camera': Camera,
      'map': MapPin,
      'pill': Pill,
      'calendar': Calendar,
      'shield': Shield,
      'globe': Globe
    };
    const Icon = icons[iconName] || HelpCircle;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="mobile-container bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold">Health Assistant</h1>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex space-x-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-[85%] p-4 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              
              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-600 mb-2">Quick suggestions:</p>
                  <div className="space-y-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-800 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-600 mb-2">Available actions:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {message.actions.map((action, idx) => (
                      <Link key={idx} href={action.route}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full justify-start text-left"
                        >
                          {getActionIcon(action.icon)}
                          <span className="ml-2">{action.label}</span>
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs mt-2 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <div className="flex space-x-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything about your health or our services..."
            className="flex-1 min-h-[60px] resize-none border-gray-300 focus:border-blue-500"
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
              className={`${isRecording ? 'bg-red-50 border-red-200 text-red-600' : ''}`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <p>Ask me anything about health services or features</p>
          {isRecording && (
            <div className="flex items-center space-x-1 text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Listening...</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Pills */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex space-x-2 overflow-x-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setInputMessage("I'm feeling unwell, what should I do?")}
            className="whitespace-nowrap"
          >
            🤒 Feeling Sick
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setInputMessage("How do I upload my medical reports?")}
            className="whitespace-nowrap"
          >
            📋 Upload Records
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setInputMessage("Find doctors specializing in cardiology")}
            className="whitespace-nowrap"
          >
            👨‍⚕️ Find Doctors
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setInputMessage("Show me global health trends")}
            className="whitespace-nowrap"
          >
            🌍 Health Trends
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setInputMessage("Emergency! I need immediate help")}
            className="whitespace-nowrap text-red-600 border-red-200"
          >
            🚨 Emergency
          </Button>
        </div>
      </div>
    </div>
  );
}