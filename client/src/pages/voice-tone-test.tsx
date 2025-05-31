import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Volume2, Play, Square, Languages, User, Stethoscope, Pill, AlertTriangle, Heart } from 'lucide-react';
import { voiceToneAdapter } from '@/lib/voice-tone-adapter';
import { useToast } from '@/hooks/use-toast';

export default function VoiceToneTest() {
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [selectedGender, setSelectedGender] = useState('male');
  const [customText, setCustomText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const languages = voiceToneAdapter.getAvailableLanguages();
    setAvailableLanguages(languages);
  }, []);

  const medicalScenarios = {
    diagnosis: {
      english: "Based on your symptoms of fever and headache, you likely have the flu. This is a viral infection that typically lasts 5-7 days.",
      hindi: "आपके बुखार और सिरदर्द के लक्षणों के आधार पर, आपको फ्लू हो सकता है। यह एक वायरल संक्रमण है जो आमतौर पर 5-7 दिन तक रहता है।",
      spanish: "Basándome en sus síntomas de fiebre y dolor de cabeza, probablemente tenga gripe. Esta es una infección viral que dura típicamente de 5 a 7 días.",
      french: "En me basant sur vos symptômes de fièvre et de mal de tête, vous avez probablement la grippe. Il s'agit d'une infection virale qui dure généralement 5 à 7 jours.",
      german: "Basierend auf Ihren Symptomen von Fieber und Kopfschmerzen haben Sie wahrscheinlich die Grippe. Dies ist eine Virusinfektion, die normalerweise 5-7 Tage dauert."
    },
    prescription: {
      english: "Take Paracetamol 500mg, one tablet every 8 hours for 3 days. Drink plenty of fluids and get adequate rest.",
      hindi: "पेरासिटामोल 500mg लें, 3 दिन के लिए हर 8 घंटे में एक गोली। पर्याप्त तरल पदार्थ पिएं और पर्याप्त आराम करें।",
      spanish: "Tome Paracetamol 500mg, una tableta cada 8 horas durante 3 días. Beba mucho líquido y descanse adecuadamente.",
      french: "Prenez du Paracétamol 500mg, un comprimé toutes les 8 heures pendant 3 jours. Buvez beaucoup de liquides et reposez-vous suffisamment.",
      german: "Nehmen Sie Paracetamol 500mg, eine Tablette alle 8 Stunden für 3 Tage. Trinken Sie viel Flüssigkeit und ruhen Sie sich ausreichend aus."
    },
    emergency: {
      english: "Your symptoms indicate a possible heart attack. Call emergency services immediately and chew an aspirin if available.",
      hindi: "आपके लक्षण दिल के दौरे की संभावना दर्शाते हैं। तुरंत आपातकालीन सेवाओं को कॉल करें और यदि उपलब्ध हो तो एस्पिरिन चबाएं।",
      spanish: "Sus síntomas indican un posible ataque cardíaco. Llame a los servicios de emergencia inmediatamente y mastique una aspirina si está disponible.",
      french: "Vos symptômes indiquent une possible crise cardiaque. Appelez immédiatement les services d'urgence et mâchez une aspirine si disponible.",
      german: "Ihre Symptome deuten auf einen möglichen Herzinfarkt hin. Rufen Sie sofort den Notdienst an und kauen Sie ein Aspirin, falls verfügbar."
    },
    general: {
      english: "Hello! I'm your AI medical assistant. How can I help you today? Please describe your symptoms in detail.",
      hindi: "नमस्ते! मैं आपका AI चिकित्सा सहायक हूं। आज मैं आपकी कैसे सहायता कर सकता हूं? कृपया अपने लक्षणों का विस्तार से वर्णन करें।",
      spanish: "¡Hola! Soy su asistente médico AI. ¿Cómo puedo ayudarle hoy? Por favor describa sus síntomas en detalle.",
      french: "Bonjour! Je suis votre assistant médical IA. Comment puis-je vous aider aujourd'hui? Veuillez décrire vos symptômes en détail.",
      german: "Hallo! Ich bin Ihr KI-Medizinassistent. Wie kann ich Ihnen heute helfen? Bitte beschreiben Sie Ihre Symptome im Detail."
    }
  };

  const languageNames = {
    english: 'English',
    hindi: 'हिंदी (Hindi)',
    spanish: 'Español (Spanish)',
    french: 'Français (French)',
    german: 'Deutsch (German)',
    portuguese: 'Português (Portuguese)',
    japanese: '日本語 (Japanese)',
    korean: '한국어 (Korean)',
    chinese: '中文 (Chinese)',
    arabic: 'العربية (Arabic)'
  };

  const testVoice = async (context: 'diagnosis' | 'prescription' | 'general' | 'emergency', text?: string) => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    
    try {
      let textToSpeak = text;
      if (!textToSpeak) {
        const scenarios = medicalScenarios[context] as any;
        textToSpeak = scenarios[selectedLanguage] || scenarios.english;
      }

      await voiceToneAdapter.speakText(
        textToSpeak,
        selectedLanguage,
        selectedGender || undefined,
        context
      );
      
      toast({
        title: "Voice Test Complete",
        description: `Played ${context} scenario in ${languageNames[selectedLanguage as keyof typeof languageNames] || selectedLanguage}`,
      });
    } catch (error) {
      toast({
        title: "Voice Test Failed",
        description: "Could not play voice. Please check your browser settings.",
        variant: "destructive",
      });
    }
    
    setIsPlaying(false);
  };

  const testCustomText = async () => {
    if (!customText.trim()) {
      toast({
        title: "No Text",
        description: "Please enter some text to test the voice.",
        variant: "destructive",
      });
      return;
    }

    await testVoice('general', customText);
  };

  const getVoiceConfig = () => {
    return voiceToneAdapter.getLanguageConfig(selectedLanguage);
  };

  const config = getVoiceConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Languages className="text-blue-600" />
              Multilingual Voice Tone Test
            </CardTitle>
            <p className="text-gray-600">
              Test advanced voice adaptation across 10 languages with medical context awareness
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="language">Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {languageNames[lang as keyof typeof languageNames] || lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gender">Patient Gender (affects voice selection)</Label>
                <Select value={selectedGender} onValueChange={setSelectedGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male (gets female doctor voice)</SelectItem>
                    <SelectItem value="female">Female (gets male doctor voice)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Voice Configuration Display */}
            {config && (
              <Card className="bg-blue-50">
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-2">Voice Configuration for {languageNames[selectedLanguage as keyof typeof languageNames]}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Rate:</span> {config.rate}
                    </div>
                    <div>
                      <span className="font-medium">Pitch:</span> {config.pitch}
                    </div>
                    <div>
                      <span className="font-medium">Cultural Tone:</span> 
                      <Badge variant="outline" className="ml-1">{config.culturalTone}</Badge>
                    </div>
                    <div>
                      <span className="font-medium">Pause:</span> {config.pauseDuration}ms
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Medical Context Tests */}
            <div>
              <h3 className="font-semibold mb-4">Medical Context Voice Tests</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  onClick={() => testVoice('general')}
                  disabled={isPlaying}
                  className="flex items-center gap-2 h-auto p-4 flex-col"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm">General Greeting</span>
                </Button>

                <Button
                  onClick={() => testVoice('diagnosis')}
                  disabled={isPlaying}
                  className="flex items-center gap-2 h-auto p-4 flex-col"
                  variant="outline"
                >
                  <Stethoscope className="h-5 w-5" />
                  <span className="text-sm">Diagnosis</span>
                </Button>

                <Button
                  onClick={() => testVoice('prescription')}
                  disabled={isPlaying}
                  className="flex items-center gap-2 h-auto p-4 flex-col"
                  variant="outline"
                >
                  <Pill className="h-5 w-5" />
                  <span className="text-sm">Prescription</span>
                </Button>

                <Button
                  onClick={() => testVoice('emergency')}
                  disabled={isPlaying}
                  className="flex items-center gap-2 h-auto p-4 flex-col"
                  variant="destructive"
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm">Emergency</span>
                </Button>
              </div>
            </div>

            {/* Custom Text Test */}
            <div>
              <Label htmlFor="custom-text">Custom Text Test</Label>
              <Textarea
                id="custom-text"
                placeholder="Enter your own text to test voice adaptation..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="mt-2"
                rows={4}
              />
              <Button
                onClick={testCustomText}
                disabled={isPlaying || !customText.trim()}
                className="mt-2 w-full"
              >
                {isPlaying ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stop Voice
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Test Custom Text
                  </>
                )}
              </Button>
            </div>

            {/* Feature Overview */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-3">Voice Adaptation Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-green-600">✓ Language Support</h5>
                    <ul className="mt-1 space-y-1 text-gray-600">
                      <li>• 10 languages with native voice selection</li>
                      <li>• Cultural tone adaptation</li>
                      <li>• Appropriate speaking rates</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-600">✓ Medical Context</h5>
                    <ul className="mt-1 space-y-1 text-gray-600">
                      <li>• Diagnosis: Slower, clear delivery</li>
                      <li>• Prescription: Precise, careful</li>
                      <li>• Emergency: Urgent, direct</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-purple-600">✓ Gender Adaptation</h5>
                    <ul className="mt-1 space-y-1 text-gray-600">
                      <li>• Male patients get female doctor voice</li>
                      <li>• Female patients get male doctor voice</li>
                      <li>• Consistent voice throughout session</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-orange-600">✓ Voice Quality</h5>
                    <ul className="mt-1 space-y-1 text-gray-600">
                      <li>• Automatic voice caching</li>
                      <li>• Fallback voice selection</li>
                      <li>• Natural pause patterns</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}