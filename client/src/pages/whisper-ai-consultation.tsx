import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WhisperSpeechRecognition } from '@/components/whisper-speech-recognition';
import { Stethoscope, User, Calendar, Phone, Mail, MapPin, Loader2, Pill, FileText, AlertTriangle, Mic } from 'lucide-react';

interface PatientDetails {
  name: string;
  age: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  language: string;
}

interface MedicalResponse {
  success: boolean;
  detectedLanguage: string;
  response: string;
  medicalAdvice: {
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
  };
  symptoms: string[];
  type: string;
  hasAudio: boolean;
  audioId: string | null;
}

interface Conversation {
  id: string;
  message: string;
  response: MedicalResponse;
  timestamp: Date;
  language: string;
  confidence: number;
}

export default function WhisperAIConsultation() {
  const [patientDetails, setPatientDetails] = useState<PatientDetails>({
    name: '',
    age: '',
    gender: '',
    bloodGroup: '',
    phone: '',
    email: '',
    address: '',
    language: 'hindi'
  });

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isInConsultation, setIsInConsultation] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState('hindi');
  const [speechConfidence, setSpeechConfidence] = useState(0);
  
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-populate patient details from user profile
  const { data: userProfile } = useQuery({
    queryKey: ['/api/user/profile'],
    enabled: true
  });

  useEffect(() => {
    if (userProfile && typeof userProfile === 'object') {
      setPatientDetails(prev => ({
        ...prev,
        name: (userProfile as any).name || '',
        phone: (userProfile as any).phone || '',
        email: (userProfile as any).email || '',
        age: (userProfile as any).age || '',
        gender: (userProfile as any).gender || '',
        bloodGroup: (userProfile as any).bloodGroup || ''
      }));
    }
  }, [userProfile]);

  // Enhanced medical consultation with Mistral AI
  const consultationMutation = useMutation({
    mutationFn: async ({ message, patientDetails }: { message: string; patientDetails: PatientDetails }) => {
      const response = await fetch('/api/ai-doctor/multilingual-consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          patientDetails
        }),
      });

      if (!response.ok) {
        throw new Error('Consultation failed');
      }

      return response.json();
    },
    onSuccess: (data: MedicalResponse) => {
      // Add to conversation history
      const conversation: Conversation = {
        id: Date.now().toString(),
        message: currentMessage,
        response: data,
        timestamp: new Date(),
        language: data.detectedLanguage || detectedLanguage,
        confidence: speechConfidence
      };

      setConversations(prev => [...prev, conversation]);
      setDetectedLanguage(data.detectedLanguage || detectedLanguage);
      setCurrentMessage('');

      // Play AI response if audio is available
      if (data.hasAudio && audioRef.current) {
        playAIResponse(data.response, data.detectedLanguage);
      }
    },
    onError: (error) => {
      console.error('Consultation error:', error);
    }
  });

  const handleWhisperTranscript = (transcript: string, language: string, confidence: number) => {
    setCurrentMessage(transcript);
    setDetectedLanguage(language);
    setSpeechConfidence(confidence);
    
    // Auto-submit if we have patient details and good confidence
    if (isInConsultation && transcript.trim() && confidence > 0.7) {
      handleSubmitConsultation(transcript);
    }
  };

  const handleSubmitConsultation = (message?: string) => {
    const messageText = message || currentMessage;
    if (!messageText.trim()) return;

    consultationMutation.mutate({
      message: messageText,
      patientDetails: {
        ...patientDetails,
        language: detectedLanguage
      }
    });
  };

  const playAIResponse = async (text: string, language: string) => {
    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          language,
          type: 'response'
        }),
      });

      if (response.ok && response.headers.get('content-type')?.includes('audio')) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          await audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Failed to play AI response:', error);
    }
  };

  const startConsultation = () => {
    // Validate required fields
    if (!patientDetails.name || !patientDetails.age || !patientDetails.gender) {
      alert('कृपया आवश्यक विवरण भरें / Please fill required details');
      return;
    }

    setIsInConsultation(true);
    
    // Play greeting
    const greeting = detectedLanguage === 'hindi' 
      ? 'नमस्ते! मैं डॉक्टर एआई हूं। आपकी स्वास्थ्य समस्या बताइए।'
      : 'Hello! I am Dr. AI. Please describe your health concerns.';
    
    playAIResponse(greeting, detectedLanguage);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      default: return <Stethoscope className="w-4 h-4" />;
    }
  };

  if (!isInConsultation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AI डॉक्टर परामर्श / AI Doctor Consultation
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                उन्नत आवाज़ पहचान के साथ बुद्धिमान चिकित्सा सहायता
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Enhanced Speech Recognition for Medical Assistance
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Patient Details Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    नाम / Name *
                  </label>
                  <Input
                    value={patientDetails.name}
                    onChange={(e) => setPatientDetails(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="अपना नाम दर्ज करें / Enter your name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    आयु / Age *
                  </label>
                  <Input
                    type="number"
                    value={patientDetails.age}
                    onChange={(e) => setPatientDetails(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="आयु / Age"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">लिंग / Gender *</label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={patientDetails.gender}
                    onChange={(e) => setPatientDetails(prev => ({ ...prev, gender: e.target.value }))}
                    required
                  >
                    <option value="">चुनें / Select</option>
                    <option value="male">पुरुष / Male</option>
                    <option value="female">महिला / Female</option>
                    <option value="other">अन्य / Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">रक्त समूह / Blood Group</label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={patientDetails.bloodGroup}
                    onChange={(e) => setPatientDetails(prev => ({ ...prev, bloodGroup: e.target.value }))}
                  >
                    <option value="">चुनें / Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    फ़ोन / Phone
                  </label>
                  <Input
                    value={patientDetails.phone}
                    onChange={(e) => setPatientDetails(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="फ़ोन नंबर / Phone number"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    ईमेल / Email
                  </label>
                  <Input
                    type="email"
                    value={patientDetails.email}
                    onChange={(e) => setPatientDetails(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="ईमेल पता / Email address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  पता / Address
                </label>
                <Input
                  value={patientDetails.address}
                  onChange={(e) => setPatientDetails(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="पूरा पता / Complete address"
                />
              </div>

              <Button
                onClick={startConsultation}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={!patientDetails.name || !patientDetails.age || !patientDetails.gender}
              >
                <Mic className="w-5 h-5 mr-2" />
                आवाज़ परामर्श शुरू करें / Start Voice Consultation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Enhanced Speech Recognition Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-center">
                  🎙️ Enhanced Speech Recognition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WhisperSpeechRecognition
                  onTranscript={handleWhisperTranscript}
                  isProcessing={consultationMutation.isPending}
                  language={detectedLanguage}
                  continuous={true}
                />
              </CardContent>
            </Card>

            {/* Patient Summary */}
            <Card className="mt-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">मरीज़ की जानकारी</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div><strong>नाम:</strong> {patientDetails.name}</div>
                <div><strong>आयु:</strong> {patientDetails.age} साल</div>
                <div><strong>लिंग:</strong> {patientDetails.gender}</div>
                {patientDetails.bloodGroup && (
                  <div><strong>रक्त समूह:</strong> {patientDetails.bloodGroup}</div>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline">
                    भाषा: {detectedLanguage}
                  </Badge>
                  {speechConfidence > 0 && (
                    <Badge variant="outline">
                      {Math.round(speechConfidence * 100)}% accurate
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversation Panel */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-bold">
                  💬 AI चिकित्सा परामर्श / AI Medical Consultation
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 overflow-auto space-y-4">
                {conversations.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <Mic className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>माइक बटन दबाकर अपने लक्षण बताएं</p>
                    <p className="text-sm">Press the mic button to describe your symptoms</p>
                  </div>
                )}

                {conversations.map((conversation) => (
                  <div key={conversation.id} className="space-y-4">
                    {/* Patient Message */}
                    <div className="flex justify-end">
                      <div className="bg-blue-500 text-white p-3 rounded-lg max-w-md">
                        <p>{conversation.message}</p>
                        <div className="text-xs opacity-75 mt-1 flex justify-between">
                          <span>{conversation.timestamp.toLocaleTimeString()}</span>
                          <span>Acc: {Math.round(conversation.confidence * 100)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Response */}
                    <div className="flex justify-start">
                      <Card className="max-w-2xl w-full">
                        <CardContent className="p-4">
                          {/* Severity Badge */}
                          <div className="flex items-center justify-between mb-3">
                            <Badge className={`${getSeverityColor(conversation.response.medicalAdvice.severity)} flex items-center`}>
                              {getSeverityIcon(conversation.response.medicalAdvice.severity)}
                              <span className="ml-1">
                                {conversation.response.medicalAdvice.severity === 'low' ? 'हल्का / Mild' :
                                 conversation.response.medicalAdvice.severity === 'moderate' ? 'मध्यम / Moderate' : 
                                 'गंभीर / Serious'}
                              </span>
                            </Badge>
                            <Badge variant="outline">{conversation.response.detectedLanguage}</Badge>
                          </div>

                          {/* Medical Advice */}
                          <div className="space-y-3">
                            <p className="text-gray-800 dark:text-gray-200">
                              {conversation.response.response}
                            </p>

                            {/* Medicines */}
                            {conversation.response.medicalAdvice.medicines.length > 0 && (
                              <div>
                                <h4 className="font-semibold flex items-center mb-2">
                                  <Pill className="w-4 h-4 mr-2" />
                                  दवाइयां / Medicines
                                </h4>
                                <div className="space-y-2">
                                  {conversation.response.medicalAdvice.medicines.map((med, index) => (
                                    <div key={index} className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm">
                                      <strong>{med.name}</strong> - {med.dose}, {med.freq}, {med.days} दिन
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Tests */}
                            {conversation.response.medicalAdvice.tests.length > 0 && (
                              <div>
                                <h4 className="font-semibold flex items-center mb-2">
                                  <FileText className="w-4 h-4 mr-2" />
                                  जांच / Tests
                                </h4>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  {conversation.response.medicalAdvice.tests.map((test, index) => (
                                    <li key={index}>{test}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Follow-up */}
                            {conversation.response.medicalAdvice.followUp.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">अनुवर्ती सलाह / Follow-up</h4>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  {conversation.response.medicalAdvice.followUp.map((advice, index) => (
                                    <li key={index}>{advice}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                            {conversation.timestamp.toLocaleTimeString()}
                            {conversation.response.hasAudio && (
                              <span className="ml-2">🔊 Audio available</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Separator />
                  </div>
                ))}

                {consultationMutation.isPending && (
                  <div className="flex justify-start">
                    <Card className="max-w-md">
                      <CardContent className="p-4 flex items-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span>डॉक्टर AI आपके लक्षणों का विश्लेषण कर रहा है...</span>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>

              {/* Manual Input Backup */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="टाइप करें या आवाज़ का उपयोग करें / Type or use voice"
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitConsultation()}
                    disabled={consultationMutation.isPending}
                  />
                  <Button
                    onClick={() => handleSubmitConsultation()}
                    disabled={!currentMessage.trim() || consultationMutation.isPending}
                  >
                    भेजें
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio 
          ref={audioRef} 
          preload="none"
          className="hidden"
        />
      </div>
    </div>
  );
}