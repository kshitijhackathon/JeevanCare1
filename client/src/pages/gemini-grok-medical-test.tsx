import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Stethoscope, Pill, AlertTriangle, Globe, Brain, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function GeminiGrokMedicalTest() {
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const patientDetails = {
    name: 'Test Patient',
    age: '25',
    gender: 'male',
    bloodGroup: 'O+'
  };

  const handleAnalysis = async () => {
    if (!symptoms.trim()) {
      toast({
        title: "Please enter symptoms",
        description: "Describe your symptoms to get medical analysis",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await apiRequest("POST", "/api/ai-doctor/enhanced-consultation", {
        message: symptoms,
        patientDetails
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResult(data);

      toast({
        title: "Analysis Complete",
        description: `Language detected: ${data.detectedLanguage}. Found ${data.medicines?.length || 0} relevant medicines.`
      });

    } catch (error) {
      console.error('Medical analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Please try again or check your connection",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'mild': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Bot className="text-blue-600" />
              Enhanced AI Medical Analysis
            </CardTitle>
            <p className="text-gray-600">
              Powered by Gemini + Grok with Authentic Indian Medicine Database
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Section */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Describe your symptoms (Hindi/English/Other languages supported)
              </label>
              <Textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Example: मुझे बुखार और सिर दर्द हो रहा है | I have fever and headache"
                rows={4}
                className="w-full"
              />
            </div>

            <Button
              onClick={handleAnalysis}
              disabled={isAnalyzing || !symptoms.trim()}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing with Gemini & Grok...
                </>
              ) : (
                <>
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Analyze Symptoms
                </>
              )}
            </Button>

            {/* Results Section */}
            {result && (
              <div className="space-y-4">
                {/* Language Detection */}
                <Card className="bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Language Detection</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-100">
                      {result.detectedLanguage}
                    </Badge>
                  </CardContent>
                </Card>

                {/* Diagnosis */}
                {result.diagnosis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        AI Diagnosis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={getSeverityColor(result.severity)}>
                          {result.diagnosis}
                        </Badge>
                        <Badge variant="outline">
                          {result.confidence}% confidence
                        </Badge>
                      </div>
                      {result.severity === 'severe' && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-red-700 font-medium">
                            Seek immediate medical attention
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Medicines from Authentic Database */}
                {result.medicines && result.medicines.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5 text-green-600" />
                        Recommended Medicines ({result.medicines.length} found)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {result.medicines.slice(0, 5).map((medicine: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-green-700">
                                {medicine.name}
                              </h4>
                              <Badge variant="outline" className="bg-green-50">
                                ₹{medicine.price}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {medicine.description}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                              <span><strong>Manufacturer:</strong> {medicine.manufacturer}</span>
                              <span><strong>Type:</strong> {medicine.type}</span>
                              <span><strong>Form:</strong> {medicine.dosageForm}</span>
                              <span><strong>Strength:</strong> {medicine.strength}</span>
                            </div>
                            {medicine.sideEffects && (
                              <p className="text-xs text-orange-600 mt-2">
                                <strong>Side Effects:</strong> {medicine.sideEffects}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Response */}
                <Card>
                  <CardHeader>
                    <CardTitle>Medical Advice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-gray-700">
                      {result.response}
                    </div>
                  </CardContent>
                </Card>

                {/* Analysis Details */}
                {(result.geminiAnalysis || result.grokAnalysis) && (
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-sm">Analysis Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.geminiAnalysis && (
                        <div>
                          <h4 className="font-medium text-purple-600 mb-1">Gemini Analysis</h4>
                          <p className="text-sm text-gray-600">
                            Severity: {result.geminiAnalysis.severity} | 
                            Confidence: {result.geminiAnalysis.confidence}%
                          </p>
                        </div>
                      )}
                      {result.grokAnalysis && (
                        <div>
                          <h4 className="font-medium text-blue-600 mb-1">Grok Analysis</h4>
                          <p className="text-sm text-gray-600">
                            Emergency Alert: {result.grokAnalysis.emergencyAlert ? 'Yes' : 'No'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Feature Overview */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-3">Enhanced Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-blue-600">✓ Automatic Language Detection</h5>
                    <p className="text-gray-600">Supports Hindi, English, and 8 other languages</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-purple-600">✓ Dual AI Analysis</h5>
                    <p className="text-gray-600">Gemini + Grok for comprehensive diagnosis</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-green-600">✓ Authentic Medicine Database</h5>
                    <p className="text-gray-600">253,973 real Indian medicines with pricing</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-orange-600">✓ Intelligent Matching</h5>
                    <p className="text-gray-600">Condition-based medicine recommendations</p>
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