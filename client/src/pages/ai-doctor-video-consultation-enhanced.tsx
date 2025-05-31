import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ttsEngine } from "@/lib/tts-engine";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Settings, 
  User, 
  ArrowLeft,
  Camera,
  MessageSquare,
  Phone,
  Clock,
  Heart,
  Activity,
  FileText,
  Calendar,
  MapPin,
  UserCheck,
  Stethoscope,
  Brain,
  Languages,
  Volume2,
  VolumeX
} from "lucide-react";
import { Link, useLocation } from "wouter";

// Indian languages with their codes
const INDIAN_LANGUAGES = [
  { code: 'eng_Latn', name: 'English', native: 'English' },
  { code: 'hin_Deva', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ben_Beng', name: 'Bengali', native: 'বাংলা' },
  { code: 'tam_Taml', name: 'Tamil', native: 'தமிழ்' },
  { code: 'tel_Telu', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mar_Deva', name: 'Marathi', native: 'मराठी' },
  { code: 'guj_Gujr', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kan_Knda', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'mal_Mlym', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pan_Guru', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ory_Orya', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'asm_Beng', name: 'Assamese', native: 'অসমীয়া' },
  { code: 'urd_Arab', name: 'Urdu', native: 'اردو' },
  { code: 'npi_Deva', name: 'Nepali', native: 'नेपाली' },
  { code: 'san_Deva', name: 'Sanskrit', native: 'संस्कृत' },
  { code: 'mai_Deva', name: 'Maithili', native: 'मैथिली' },
  { code: 'brx_Deva', name: 'Bodo', native: 'बोडो' },
  { code: 'doi_Deva', name: 'Dogri', native: 'डोगरी' },
  { code: 'gom_Deva', name: 'Konkani', native: 'कोंकणी' },
  { code: 'kas_Arab', name: 'Kashmiri (Arabic)', native: 'کٲشُر' },
  { code: 'kas_Deva', name: 'Kashmiri (Devanagari)', native: 'कॉशुर' },
  { code: 'mni_Beng', name: 'Manipuri (Bengali)', native: 'মৈতৈলোন্' },
  { code: 'mni_Mtei', name: 'Manipuri (Meitei)', native: 'ꯃꯩꯇꯩꯂꯣꯟ' },
  { code: 'sat_Olck', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'snd_Arab', name: 'Sindhi (Arabic)', native: 'سنڌي' },
  { code: 'snd_Deva', name: 'Sindhi (Devanagari)', native: 'सिन्धी' }
];

// Animated Doctor Avatar Component (CSS-based)
function DoctorAvatar({ isListening, isSpeaking }: { isListening: boolean; isSpeaking: boolean }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="relative">
        {/* Doctor Avatar */}
        <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-300 ${
          isSpeaking ? 'bg-gradient-to-br from-green-400 to-green-600 animate-pulse' :
          isListening ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
          'bg-gradient-to-br from-gray-300 to-gray-500'
        }`}>
          <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Stethoscope className="w-24 h-24 text-blue-600" />
          </div>
        </div>
        
        {/* Animated rings for speaking */}
        {isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full border-4 border-green-300 animate-ping"></div>
            <div className="absolute inset-4 rounded-full border-2 border-green-400 animate-pulse"></div>
          </>
        )}
        
        {/* Animated rings for listening */}
        {isListening && (
          <>
            <div className="absolute inset-0 rounded-full border-4 border-blue-300 animate-pulse"></div>
            <div className="absolute inset-8 rounded-full border-2 border-blue-400 animate-ping"></div>
          </>
        )}
        
        {/* Status indicators */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          {isSpeaking && (
            <div className="flex space-x-1">
              <div className="w-2 h-6 bg-green-500 rounded animate-bounce"></div>
              <div className="w-2 h-8 bg-green-400 rounded animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-4 bg-green-300 rounded animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          )}
          {isListening && (
            <div className="flex space-x-1">
              <div className="w-2 h-4 bg-blue-500 rounded animate-pulse"></div>
              <div className="w-2 h-6 bg-blue-400 rounded animate-pulse" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-8 bg-blue-300 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Patient Details Form
function PatientDetailsForm({ onSubmit }: { onSubmit: (details: any) => void }) {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    language: 'eng_Latn',
    phoneNumber: '',
    city: '',
    emergencyContact: '',
    medicalHistory: '',
    currentSymptoms: '',
    allergies: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4"
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">AI Doctor Consultation</h1>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <span>Patient Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    required
                    placeholder="Enter your age"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
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
                  <Label htmlFor="language" className="flex items-center space-x-2">
                    <Languages className="h-4 w-4" />
                    <span>Preferred Language</span>
                  </Label>
                  <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {INDIAN_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center justify-between w-full">
                            <span>{lang.name}</span>
                            <span className="text-sm text-gray-500 ml-2">{lang.native}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    required
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    required
                    placeholder="Enter your city"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="emergency">Emergency Contact</Label>
                <Input
                  id="emergency"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  placeholder="Emergency contact number"
                />
              </div>

              <div>
                <Label htmlFor="symptoms">Current Symptoms</Label>
                <Textarea
                  id="symptoms"
                  value={formData.currentSymptoms}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentSymptoms: e.target.value }))}
                  placeholder="Describe your current symptoms..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="history">Medical History</Label>
                <Textarea
                  id="history"
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicalHistory: e.target.value }))}
                  placeholder="Any previous medical conditions, surgeries, or ongoing treatments..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                  placeholder="Any known allergies to medications, food, or other substances..."
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                <Video className="h-4 w-4 mr-2" />
                Start Video Consultation
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Video Consultation Interface
function VideoConsultationInterface({ patientDetails }: { patientDetails: any }) {
  const [, setLocation] = useLocation();
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState<Array<{role: 'doctor' | 'patient', message: string, timestamp: Date}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const { toast } = useToast();
  
  const selectedLanguage = INDIAN_LANGUAGES.find(lang => lang.code === patientDetails.language) || INDIAN_LANGUAGES[0];

  // Doctor's initial greeting with translation and voice
  useEffect(() => {
    const translateGreetAndSpeak = async () => {
      const englishGreeting = `Namaste ${patientDetails.name}! I am Dr. AI, your virtual physician. I can see you're experiencing some symptoms. Let's discuss them in ${selectedLanguage.name}. How are you feeling today?`;
      
      let finalGreeting = englishGreeting;
      
      // Translate if not English
      if (selectedLanguage.code !== 'eng_Latn') {
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: englishGreeting,
              sourceLang: 'eng_Latn',
              targetLang: selectedLanguage.code
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            finalGreeting = result.translatedText;
          }
        } catch (error) {
          console.error('Translation failed:', error);
        }
      }
      
      setConversation([{
        role: 'doctor',
        message: finalGreeting,
        timestamp: new Date()
      }]);
      
      setIsSpeaking(true);
      
      // Use enhanced TTS to speak the greeting
      try {
        await ttsEngine.speakMedicalGreeting(selectedLanguage.code, patientDetails.name);
      } catch (error) {
        console.error('TTS failed:', error);
        // Fallback to basic TTS
        try {
          await ttsEngine.speak({
            text: finalGreeting,
            language: selectedLanguage.code,
            gender: 'female',
            emotion: 'warm'
          });
        } catch (fallbackError) {
          console.error('Fallback TTS failed:', fallbackError);
        }
      } finally {
        setIsSpeaking(false);
      }
    };
    
    setTimeout(translateGreetAndSpeak, 1000);
  }, [patientDetails, selectedLanguage]);

  // Mock translation function (would use IndicTrans2 in production)
  const translateMessage = async (message: string, targetLang: string) => {
    // In production, this would call IndicTrans2 API
    return message; // For now, returning as-is
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = currentMessage.trim();
    const patientMessage = {
      role: 'patient' as const,
      message: userMessage,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, patientMessage]);
    setCurrentMessage('');
    
    // Simulate AI doctor response
    setIsListening(true);
    setTimeout(async () => {
      setIsListening(false);
      setIsSpeaking(true);
      
      let aiResponse = `I understand your concern about "${userMessage}". Based on your symptoms, let me provide some guidance. Can you tell me more about when these symptoms started?`;
      
      // Translate response if needed
      if (selectedLanguage.code !== 'eng_Latn') {
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: aiResponse,
              sourceLang: 'eng_Latn',
              targetLang: selectedLanguage.code
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            aiResponse = result.translatedText;
          }
        } catch (error) {
          console.error('Translation failed:', error);
        }
      }
      
      const doctorResponse = {
        role: 'doctor' as const,
        message: aiResponse,
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, doctorResponse]);
      
      // Speak the doctor's response using enhanced TTS
      try {
        await ttsEngine.speakFollowUpQuestion(aiResponse, selectedLanguage.code);
      } catch (error) {
        console.error('TTS failed for response:', error);
        // Fallback to basic TTS
        try {
          await ttsEngine.speak({
            text: aiResponse,
            language: selectedLanguage.code,
            gender: 'female',
            emotion: 'professional'
          });
        } catch (fallbackError) {
          console.error('Fallback TTS failed:', fallbackError);
        }
      } finally {
        setIsSpeaking(false);
      }
    }, 1500);
  };

  // Voice recording functionality
  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice Recognition Not Supported",
        description: "Your browser doesn't support voice recognition. Please type your message.",
        variant: "destructive"
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = selectedLanguage.code === 'eng_Latn' ? 'en-IN' : 
                     selectedLanguage.code === 'hin_Deva' ? 'hi-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsRecording(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setCurrentMessage(transcript);
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      toast({
        title: "Voice Recognition Error",
        description: "Could not capture your voice. Please try again or type your message.",
        variant: "destructive"
      });
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const stopSpeaking = () => {
    ttsEngine.stop();
    setIsSpeaking(false);
  };

  const endCall = () => {
    ttsEngine.stop(); // Stop any ongoing speech
    toast({
      title: "Consultation Ended",
      description: "Thank you for using AI Doctor Consultation. Your session summary will be sent to your registered email.",
    });
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-6 w-6 text-blue-400" />
              <h1 className="text-xl font-semibold">Dr. AI Consultation</h1>
            </div>
            <Badge variant="secondary" className="bg-green-600">
              <div className="w-2 h-2 bg-green-300 rounded-full mr-2"></div>
              Live Session
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-blue-300 border-blue-300">
              <Languages className="h-3 w-3 mr-1" />
              {selectedLanguage.name}
            </Badge>
            <Badge variant="outline" className="text-gray-300">
              <Clock className="h-3 w-3 mr-1" />
              {new Date().toLocaleTimeString()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-80px)]">
        {/* Doctor Avatar */}
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-900 to-indigo-900 relative">
          <div className="absolute top-4 left-4 z-10">
            <Badge className="bg-blue-600">
              <Brain className="h-3 w-3 mr-1" />
              AI Doctor
            </Badge>
          </div>
          
          <div className="absolute top-4 right-4 z-10 flex space-x-2">
            {isSpeaking && (
              <Badge className="bg-green-600 animate-pulse">
                <Volume2 className="h-3 w-3 mr-1" />
                Speaking
              </Badge>
            )}
            {isListening && (
              <Badge className="bg-blue-600 animate-pulse">
                <Mic className="h-3 w-3 mr-1" />
                Listening
              </Badge>
            )}
          </div>

          <DoctorAvatar isListening={isListening} isSpeaking={isSpeaking} />

          {/* Patient Video (placeholder) */}
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg border-2 border-gray-600">
            <div className="w-full h-full flex items-center justify-center">
              {isVideoOn ? (
                <div className="text-center">
                  <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-400">{patientDetails.name}</p>
                </div>
              ) : (
                <VideoOff className="h-8 w-8 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* Chat and Controls */}
        <div className="bg-gray-800 flex flex-col">
          {/* Conversation History */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Conversation
            </h3>
            <div className="space-y-3">
              {conversation.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'patient' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg ${
                    msg.role === 'patient' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-100'
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2 mb-4">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-gray-700 border-gray-600 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage} size="sm">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              <Button
                variant={isMicOn ? "default" : "destructive"}
                size="sm"
                onClick={() => setIsMicOn(!isMicOn)}
              >
                {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              
              <Button
                variant={isVideoOn ? "default" : "destructive"}
                size="sm"
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={endCall}
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIDoctorvVideoConsultationEnhanced() {
  const [step, setStep] = useState<'details' | 'consultation'>('details');
  const [patientDetails, setPatientDetails] = useState(null);

  const handlePatientDetailsSubmit = (details: any) => {
    setPatientDetails(details);
    setStep('consultation');
  };

  if (step === 'details') {
    return <PatientDetailsForm onSubmit={handlePatientDetailsSubmit} />;
  }

  return <VideoConsultationInterface patientDetails={patientDetails} />;
}