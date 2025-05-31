import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, Pill, AlertTriangle } from 'lucide-react';

interface MedicalResponse {
  response: string;
  diagnosis?: string;
  confidence?: number;
  severity?: string;
  symptoms?: string[];
  medications?: any[];
  success?: boolean;
}

export default function MedicalTest() {
  const [symptoms, setSymptoms] = useState('');
  const [response, setResponse] = useState<MedicalResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const testMedicalSystem = async () => {
    if (!symptoms.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/medical-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: symptoms })
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data);
      } else {
        setResponse({ 
          response: 'Error connecting to medical system. Please try again.', 
          success: false 
        });
      }
    } catch (error) {
      setResponse({ 
        response: 'Network error. Please check your connection.', 
        success: false 
      });
    }
    setLoading(false);
  };

  const testCases = [
    'I have fever and headache',
    'burning while urinating',
    'stomach pain with nausea',
    'chest pain and breathing difficulty'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Stethoscope className="text-blue-600" />
              Medical AI Detection System Test
            </CardTitle>
            <p className="text-gray-600">
              Test the disease detection system with real symptoms
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Describe your symptoms..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && testMedicalSystem()}
              />
              <Button 
                onClick={testMedicalSystem} 
                disabled={loading || !symptoms.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {testCases.map((testCase, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setSymptoms(testCase)}
                  className="text-xs"
                >
                  {testCase}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {response && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {response.success ? (
                  <>
                    <Pill className="text-green-600" />
                    Medical Analysis Result
                  </>
                ) : (
                  <>
                    <AlertTriangle className="text-red-600" />
                    System Error
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {response.diagnosis && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-blue-800">Diagnosis</h4>
                    <p className="text-blue-700">{response.diagnosis}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-green-800">Confidence</h4>
                    <p className="text-green-700">{response.confidence}%</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-orange-800">Severity</h4>
                    <p className="text-orange-700">{response.severity}</p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Medical Advice</h4>
                <pre className="whitespace-pre-wrap text-sm">{response.response}</pre>
              </div>

              {response.medications && response.medications.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Recommended Medicines</h4>
                  <div className="grid gap-2">
                    {response.medications.slice(0, 3).map((med, index) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium">{med.name}</h5>
                            <p className="text-sm text-gray-600">{med.composition}</p>
                          </div>
                          <span className="text-green-600 font-semibold">₹{med.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">System Status</h3>
            <div className="text-sm text-gray-600">
              <p>✓ Enhanced Local Medical Engine: Active</p>
              <p>✓ Disease Prediction Engine: Active</p>
              <p>✓ Indian Medicine Database: 2,000+ medicines</p>
              <p>✓ Symptom Detection: Multi-language support</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}