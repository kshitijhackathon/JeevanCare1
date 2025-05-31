import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import VoiceHealthCompanion from '@/components/voice-health-companion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Activity, FileText, Pill, Stethoscope, Brain, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MedicalResponse {
  response: string;
  symptoms: string[];
  diagnosis: string | null;
  confidence: number;
  severity: string;
  medicines: any[];
  prescription: any;
  language: string;
  type: string;
}

export default function VoiceCompanion() {
  const [currentAnalysis, setCurrentAnalysis] = useState<MedicalResponse | null>(null);
  const [sessionHistory, setSessionHistory] = useState<MedicalResponse[]>([]);
  const { toast } = useToast();

  // Fetch user profile for personalization
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/user');
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const handleSymptomDetected = (symptoms: string[], language: string) => {
    console.log('Symptoms detected:', symptoms, 'Language:', language);
    toast({
      title: "Symptoms Detected",
      description: `Found ${symptoms.length} symptoms in your voice input`,
    });
  };

  const handleMedicalResponse = (response: MedicalResponse) => {
    setCurrentAnalysis(response);
    setSessionHistory(prev => [...prev, response]);
    
    if (response.diagnosis) {
      toast({
        title: "Medical Analysis Complete",
        description: `Diagnosis: ${response.diagnosis} (${response.confidence.toFixed(1)}% confidence)`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-blue-900 dark:to-green-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-center gap-3">
            <Globe className="h-10 w-10 text-blue-600" />
            Voice Health Companion
            <Brain className="h-10 w-10 text-green-600" />
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Speak your health concerns in any language and receive instant medical analysis 
            powered by advanced AI and authentic medical data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voice Companion - Main Component */}
          <div className="lg:col-span-2">
            <VoiceHealthCompanion
              onSymptomDetected={handleSymptomDetected}
              onMedicalResponse={handleMedicalResponse}
            />
          </div>

          {/* Analysis Results Sidebar */}
          <div className="space-y-6">
            {/* Current Analysis */}
            {currentAnalysis && (
              <Card className="border-2 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <Stethoscope className="h-5 w-5" />
                    Current Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentAnalysis.diagnosis && (
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        Diagnosis
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {currentAnalysis.diagnosis}
                        </Badge>
                        <Badge variant="secondary">
                          {currentAnalysis.confidence.toFixed(1)}% confidence
                        </Badge>
                        <Badge 
                          variant={currentAnalysis.severity === 'severe' ? 'destructive' : 
                                 currentAnalysis.severity === 'moderate' ? 'default' : 'secondary'}
                        >
                          {currentAnalysis.severity}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {currentAnalysis.symptoms.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Detected Symptoms
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {currentAnalysis.symptoms.map((symptom, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentAnalysis.medicines.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                        <Pill className="h-4 w-4" />
                        Recommended Medicines
                      </h4>
                      <div className="space-y-2">
                        {currentAnalysis.medicines.slice(0, 3).map((medicine, index) => (
                          <div key={index} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border">
                            <div className="font-medium text-sm">{medicine.name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {medicine.composition}
                            </div>
                            <div className="text-xs text-green-600 dark:text-green-400 font-semibold">
                              ₹{medicine.price}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentAnalysis.prescription && (
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Prescription Available
                      </h4>
                      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        Digital prescription generated
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Session History */}
            {sessionHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Session History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {sessionHistory.slice(-5).reverse().map((analysis, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {analysis.language?.includes('hi') ? '🇮🇳 Hindi' : 
                             analysis.language?.includes('en') ? '🇺🇸 English' : 
                             '🌍 Multilingual'}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {new Date().toLocaleTimeString()}
                          </Badge>
                        </div>
                        
                        {analysis.diagnosis && (
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {analysis.diagnosis}
                          </div>
                        )}
                        
                        {analysis.symptoms.length > 0 && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Symptoms: {analysis.symptoms.slice(0, 3).join(', ')}
                            {analysis.symptoms.length > 3 && '...'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Info */}
            {user && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Patient Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {user.firstName} {user.lastName}
                  </div>
                  {user.age && (
                    <div>
                      <span className="font-medium">Age:</span> {user.age}
                    </div>
                  )}
                  {user.gender && (
                    <div>
                      <span className="font-medium">Gender:</span> {user.gender}
                    </div>
                  )}
                  {user.bloodGroup && (
                    <div>
                      <span className="font-medium">Blood Group:</span> {user.bloodGroup}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Globe className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Multilingual Support</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Speak in Hindi, English, Spanish, French, German, Portuguese, Japanese, Korean, Chinese, or Arabic
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Brain className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">AI Disease Prediction</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Advanced algorithms analyze your symptoms and predict potential conditions
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Pill className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Medicine Recommendations</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get authentic Indian medicine suggestions with real pricing data
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <FileText className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Digital Prescriptions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive professional digital prescriptions for your conditions
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* Privacy Notice */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          <p>
            Your voice data is processed securely and used only for medical analysis. 
            This service provides preliminary health guidance and should not replace professional medical consultation.
            Always consult with qualified healthcare providers for serious medical concerns.
          </p>
        </div>
      </div>
    </div>
  );
}