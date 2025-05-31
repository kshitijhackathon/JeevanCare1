import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WhisperSpeechRecognition } from '@/components/whisper-speech-recognition';
import { BodyModel3D } from '@/components/3d-body-model';
import { JeevancarePrescription } from '@/components/jeevancare-prescription';
import { 
  Stethoscope, User, Calendar, Phone, Mail, MapPin, Loader2, 
  Pill, FileText, AlertTriangle, Video, VideoOff, Mic, MicOff,
  PhoneCall, X, Volume2, Clock, Eye, Smile, ArrowLeft, Home
} from 'lucide-react';
import { useLocation } from 'wouter';

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

interface MedicalConsultation {
  greeting: string;
  diagnosis: string;
  medicines: Array<{
    name: string;
    composition: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    timing: string;
  }>;
  tests: Array<{
    name: string;
    type: string;
    urgency: string;
    instructions: string;
  }>;
  lifestyle: string[];
  precautions: string[];
  followUp: string;
  severity: 'mild' | 'moderate' | 'severe';
  emergencyContact: boolean;
}

interface ConsultationResponse {
  success: boolean;
  consultation: MedicalConsultation;
  voiceResponse: {
    hasMainAudio: boolean;
    hasGreeting: boolean;
    audioId: string | null;
    greetingId: string | null;
    humanLikeVoice: boolean;
    credentialsMessage: string | null;
  };
  patientContext: {
    name: string;
    age: string;
    language: string;
    detectedLanguage: string;
  };
}

export default function AIDoctorVideoConsultation() {
  const [, setLocation] = useLocation();
  
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

  const [isInConsultation, setIsInConsultation] = useState(false);
  const [currentSymptoms, setCurrentSymptoms] = useState('');
  const [consultation, setConsultation] = useState<MedicalConsultation | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [detectedLanguage, setDetectedLanguage] = useState('hindi');
  const [speechConfidence, setSpeechConfidence] = useState(0);
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [showPrescription, setShowPrescription] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [doctorAction, setDoctorAction] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-populate patient details
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

  // AI Doctor consultation mutation
  const consultationMutation = useMutation({
    mutationFn: async ({ symptoms, patientDetails }: { symptoms: string; patientDetails: PatientDetails }) => {
      const response = await fetch('/api/ai-doctor/indic-consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms,
          patientDetails
        }),
      });

      if (!response.ok) {
        throw new Error('AI Doctor consultation failed');
      }

      return response.json() as Promise<ConsultationResponse>;
    },
    onSuccess: async (data: ConsultationResponse) => {
      setConsultation(data.consultation);
      setDetectedLanguage(data.patientContext.detectedLanguage);
      
      // Check if doctor wants specific examination
      const response = data.consultation.diagnosis.toLowerCase();
      if (response.includes('दिखाओ') || response.includes('show') || response.includes('eyes') || response.includes('आंख')) {
        setDoctorAction('eyes');
      } else if (response.includes('मुंह') || response.includes('mouth') || response.includes('खोल')) {
        setDoctorAction('mouth');
      } else if (response.includes('दर्द') || response.includes('pain') || response.includes('tap') || response.includes('point')) {
        setDoctorAction('body_model');
      }
      
      // Play voice response
      if (data.voiceResponse.hasGreeting && data.voiceResponse.greetingId) {
        await playAudio(data.voiceResponse.greetingId);
        setTimeout(() => {
          if (data.voiceResponse.hasMainAudio && data.voiceResponse.audioId) {
            playAudio(data.voiceResponse.audioId);
          }
        }, 1000);
      } else if (data.voiceResponse.hasMainAudio && data.voiceResponse.audioId) {
        await playAudio(data.voiceResponse.audioId);
      }

      // Auto-generate prescription after complete consultation
      if (data.consultation.medicines.length > 0) {
        setTimeout(() => {
          setIsReviewing(true);
          setTimeout(() => {
            setIsReviewing(false);
            setShowPrescription(true);
          }, 60000); // 1 minute review
        }, 3000);
      }
    },
    onError: (error) => {
      console.error('Consultation error:', error);
    }
  });

  // Initialize video stream
  const startVideoCall = async () => {
    try {
      // Request permissions first
      const constraints = {
        video: true,
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setIsInConsultation(true);
      console.log('Video call started successfully');
      
      // Auto-start Dr. Saarthi AI greeting
      setTimeout(() => {
        const greeting = patientDetails.language === 'hindi' 
          ? `नमस्ते ${patientDetails.name} जी, मैं Dr. Saarthi AI हूं। आपकी क्या तकलीफ है? कृपया अपने लक्षण बताइए।`
          : `Hello ${patientDetails.name}, I am Dr. Saarthi AI. What seems to be bothering you today? Please describe your symptoms.`;
        
        handleSubmitSymptoms(greeting);
      }, 2000);
      
    } catch (error) {
      console.error('Video call failed:', error);
      
      // Try audio-only fallback
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = audioStream;
        setIsVideoEnabled(false);
        setIsInConsultation(true);
        console.log('Audio-only consultation started');
      } catch (audioError) {
        console.error('Audio access failed:', audioError);
        // Still allow consultation without media
        setIsInConsultation(true);
        alert('Continue without camera/microphone - you can type your symptoms');
      }
    }
  };

  const stopVideoCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsInConsultation(false);
    setConsultation(null);
    setShowPrescription(false);
    setIsReviewing(false);
    setDoctorAction(null);
    setSelectedBodyParts([]);
  };

  const goToHome = () => {
    stopVideoCall();
    setLocation('/');
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
      }
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
      }
    }
  };

  const playAudio = async (audioId: string) => {
    try {
      const response = await fetch(`/api/ai-doctor/audio/${audioId}`);
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          await audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };

  const handleVoiceInput = (transcript: string, language: string, confidence: number) => {
    setCurrentSymptoms(transcript);
    setDetectedLanguage(language);
    setSpeechConfidence(confidence);
    
    // Auto-submit for ANY user input - AI should respond to everything
    if (transcript.trim().length > 3) {
      // Include body part information if selected
      const bodyPartsInfo = selectedBodyParts.length > 0 
        ? ` Pain areas selected: ${selectedBodyParts.join(', ')}` 
        : '';
      handleSubmitSymptoms(transcript + bodyPartsInfo);
    }
  };

  const handleBodyPainSelection = (bodyPart: string, location: { x: number; y: number }) => {
    setSelectedBodyParts(prev => {
      const newParts = prev.includes(bodyPart) 
        ? prev.filter(p => p !== bodyPart)
        : [...prev, bodyPart];
      
      // Auto-inform doctor about pain selection
      const painMessage = patientDetails.language === 'hindi'
        ? `मुझे ${bodyPart} में दर्द है`
        : `I have pain in ${bodyPart}`;
      
      setTimeout(() => handleSubmitSymptoms(painMessage), 500);
      return newParts;
    });
  };

  const handleSubmitSymptoms = (symptoms?: string) => {
    const symptomsText = symptoms || currentSymptoms;
    if (!symptomsText.trim()) return;

    consultationMutation.mutate({
      symptoms: symptomsText,
      patientDetails: {
        ...patientDetails,
        language: detectedLanguage
      }
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'severe': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (!isInConsultation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center relative">
              {/* Back/Home Button */}
              <Button
                onClick={goToHome}
                variant="outline"
                size="sm"
                className="absolute left-4 top-4 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AI डॉक्टर वीडियो परामर्श / AI Doctor Video Consultation
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                मल्टीलिंगुअल AI डॉक्टर के साथ वास्तविक समय वीडियो परामर्श
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Real-time Video Consultation with Multilingual AI Doctor
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
                  <label className="text-sm font-medium">भाषा / Language *</label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={patientDetails.language}
                    onChange={(e) => setPatientDetails(prev => ({ ...prev, language: e.target.value }))}
                    required
                  >
                    <option value="hindi">हिंदी / Hindi</option>
                    <option value="english">English</option>
                    <option value="bengali">বাংলা / Bengali</option>
                    <option value="tamil">தமிழ் / Tamil</option>
                    <option value="telugu">తెలుగు / Telugu</option>
                    <option value="gujarati">ગુજરાતી / Gujarati</option>
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
                    <option value="unknown">पता नहीं / Not Known</option>
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
              </div>

              <Button
                onClick={startVideoCall}
                size="lg"
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg"
                disabled={!patientDetails.name || !patientDetails.age || !patientDetails.gender}
              >
                <PhoneCall className="w-6 h-6 mr-3" />
                <span className="text-lg">
                  Dr. Saarthi AI से मिलें / Connect with Dr. Saarthi AI
                </span>
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
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={goToHome}
            variant="outline"
            size="sm"
            className="flex items-center bg-white/80 hover:bg-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Home / होम
          </Button>
          
          <h1 className="text-2xl font-bold text-center flex-1">
            Dr. Saarthi AI - Live Consultation
          </h1>
          
          <Button
            onClick={stopVideoCall}
            variant="destructive"
            size="sm"
            className="flex items-center"
          >
            <X className="w-4 h-4 mr-2" />
            End Call
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Video Call Interface */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-center">
                  🩺 AI डॉक्टर / AI Doctor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Video Display - Zoom-like interface */}
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video border-2 border-blue-500">
                  {/* Patient Video (Self) */}
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Doctor AI Avatar Overlay */}
                  <div className="absolute top-4 right-4 w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                    <div className="text-white text-center">
                      <Stethoscope className="w-8 h-8 mx-auto mb-1" />
                      <div className="text-xs font-semibold">Dr. Saarthi</div>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-2 py-1 rounded text-xs">
                    🔴 LIVE - AI Doctor Consultation
                  </div>
                  
                  {/* Call Controls */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3 bg-black bg-opacity-50 rounded-full px-4 py-2">
                    <Button
                      onClick={toggleVideo}
                      size="sm"
                      variant={isVideoEnabled ? "secondary" : "destructive"}
                      className="rounded-full w-10 h-10"
                    >
                      {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </Button>
                    
                    <Button
                      onClick={toggleAudio}
                      size="sm"
                      variant={isAudioEnabled ? "secondary" : "destructive"}
                      className="rounded-full w-10 h-10"
                    >
                      {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                    
                    <Button
                      onClick={stopVideoCall}
                      size="sm"
                      variant="destructive"
                      className="rounded-full w-10 h-10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Voice Input */}
                <WhisperSpeechRecognition
                  onTranscript={handleVoiceInput}
                  isProcessing={consultationMutation.isPending}
                  language={detectedLanguage}
                  continuous={true}
                />

                {/* Patient Info */}
                <div className="text-sm space-y-1">
                  <div><strong>मरीज़:</strong> {patientDetails.name}</div>
                  <div><strong>आयु:</strong> {patientDetails.age} साल</div>
                  <div><strong>भाषा:</strong> {patientDetails.language}</div>
                  {speechConfidence > 0 && (
                    <Badge variant="outline">
                      Speech: {Math.round(speechConfidence * 100)}% accurate
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Consultation Results */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center">
                  <Stethoscope className="w-5 h-5 mr-2" />
                  Dr. Saarthi AI - चिकित्सा परामर्श / Medical Consultation
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 overflow-auto space-y-4">
                {/* Reviewing State */}
                {isReviewing && (
                  <div className="text-center py-8 bg-blue-50 rounded-lg">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin" />
                    <h3 className="text-lg font-semibold mb-2">Cross-checking & Reviewing by Dr. Saarthi</h3>
                    <p className="text-gray-600">कृपया प्रतीक्षा करें... डॉक्टर आपके केस की समीक्षा कर रहे हैं</p>
                    <div className="mt-4">
                      <div className="bg-blue-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-blue-600 h-full animate-pulse w-3/4"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Doctor Action Requests */}
                {doctorAction === 'eyes' && (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        <Eye className="w-6 h-6 mr-2 text-yellow-600" />
                        <h3 className="font-semibold">डॉक्टर का निर्देश / Doctor's Request</h3>
                      </div>
                      <p className="mb-3">कृपया अपनी आंखें कैमरे के सामने दिखाएं / Please show your eyes to the camera</p>
                      <Button 
                        onClick={() => setDoctorAction(null)}
                        size="sm"
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        Done / हो गया
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {doctorAction === 'mouth' && (
                  <Card className="bg-pink-50 border-pink-200">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        <Smile className="w-6 h-6 mr-2 text-pink-600" />
                        <h3 className="font-semibold">डॉक्टर का निर्देश / Doctor's Request</h3>
                      </div>
                      <p className="mb-3">कृपया मुंह खोलकर दिखाएं / Please open your mouth and show</p>
                      <Button 
                        onClick={() => setDoctorAction(null)}
                        size="sm"
                        className="bg-pink-600 hover:bg-pink-700"
                      >
                        Done / हो गया
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {doctorAction === 'body_model' && (
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4">
                      <BodyModel3D 
                        onPainPointSelect={handleBodyPainSelection}
                        selectedParts={selectedBodyParts}
                      />
                      <Button 
                        onClick={() => setDoctorAction(null)}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 mt-3 w-full"
                      >
                        Pain Areas Selected / दर्द की जगह चुनी गई
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {!consultation && !consultationMutation.isPending && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <Volume2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>अपने लक्षण बताइए / Describe your symptoms</p>
                    <p className="text-sm">AI Doctor will provide real-time consultation</p>
                  </div>
                )}

                {consultationMutation.isPending && (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>AI डॉक्टर आपके लक्षणों का विश्लेषण कर रहा है...</p>
                  </div>
                )}

                {consultation && (
                  <div className="space-y-6">
                    {/* Greeting */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">डॉक्टर का संदेश:</h3>
                        <p>{consultation.greeting}</p>
                      </CardContent>
                    </Card>

                    {/* Diagnosis */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">निदान / Diagnosis</h3>
                          <Badge className={getSeverityColor(consultation.severity)}>
                            {consultation.severity === 'mild' ? 'हल्का / Mild' :
                             consultation.severity === 'moderate' ? 'मध्यम / Moderate' : 
                             'गंभीर / Severe'}
                          </Badge>
                        </div>
                        <p>{consultation.diagnosis}</p>
                      </CardContent>
                    </Card>

                    {/* Medicines */}
                    {consultation.medicines.length > 0 && (
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold flex items-center mb-3">
                            <Pill className="w-4 h-4 mr-2" />
                            दवाइयां / Medicines
                          </h3>
                          <div className="space-y-3">
                            {consultation.medicines.map((med, index) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                                <div className="font-medium">{med.name}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                  {med.composition}
                                </div>
                                <div className="text-sm mt-1">
                                  <strong>खुराक:</strong> {med.dosage} - {med.frequency} - {med.duration}
                                </div>
                                <div className="text-sm">
                                  <strong>निर्देश:</strong> {med.instructions} ({med.timing})
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Tests */}
                    {consultation.tests.length > 0 && (
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold flex items-center mb-3">
                            <FileText className="w-4 h-4 mr-2" />
                            जांच / Tests Required
                          </h3>
                          <div className="space-y-2">
                            {consultation.tests.map((test, index) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm">
                                <strong>{test.name}</strong> ({test.type}) - {test.urgency}
                                {test.instructions && <div className="text-gray-600">{test.instructions}</div>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Lifestyle & Precautions */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-3">सावधानियां और सुझाव</h3>
                        {consultation.precautions.length > 0 && (
                          <div className="mb-3">
                            <strong>सावधानियां:</strong>
                            <ul className="list-disc list-inside text-sm mt-1">
                              {consultation.precautions.map((precaution, index) => (
                                <li key={index}>{precaution}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {consultation.lifestyle.length > 0 && (
                          <div className="mb-3">
                            <strong>जीवनशैली:</strong>
                            <ul className="list-disc list-inside text-sm mt-1">
                              {consultation.lifestyle.map((lifestyle, index) => (
                                <li key={index}>{lifestyle}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div>
                          <strong>फॉलो-अप:</strong> {consultation.followUp}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>

              {/* Manual Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={currentSymptoms}
                    onChange={(e) => setCurrentSymptoms(e.target.value)}
                    placeholder="टाइप करें या आवाज़ का उपयोग करें / Type or use voice"
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitSymptoms()}
                    disabled={consultationMutation.isPending}
                  />
                  <Button
                    onClick={() => handleSubmitSymptoms()}
                    disabled={!currentSymptoms.trim() || consultationMutation.isPending}
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

        {/* Prescription Modal */}
        {showPrescription && consultation && (
          <JeevancarePrescription
            data={{
              patientName: patientDetails.name,
              age: patientDetails.age,
              date: new Date().toLocaleDateString('en-IN'),
              bloodGroup: patientDetails.bloodGroup || 'Not Known',
              gender: patientDetails.gender,
              symptoms: selectedBodyParts.length > 0 
                ? [...consultation.diagnosis.split(','), ...selectedBodyParts.map(part => `Pain in ${part}`)]
                : [consultation.diagnosis],
              medicines: consultation.medicines,
              tests: consultation.tests,
              doctorAdvice: [...consultation.lifestyle, ...consultation.precautions],
              followUp: consultation.followUp
            }}
            onClose={() => setShowPrescription(false)}
          />
        )}
      </div>
    </div>
  );
}