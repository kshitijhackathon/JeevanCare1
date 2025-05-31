import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  Search, 
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Thermometer,
  Heart,
  Brain,
  Eye,
  Ear,
  Pill,
  Calendar,
  MapPin,
  User,
  Stethoscope
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Symptom {
  id: string;
  name: string;
  category: string;
  icon: any;
  severity: 'mild' | 'moderate' | 'severe';
  color: string;
}

interface SymptomCheck {
  symptoms: string[];
  duration: string;
  severity: string;
  additionalInfo: string;
  results: {
    possibleConditions: string[];
    urgencyLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
    nextSteps: string[];
  };
}

export default function SymptomChecker() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SymptomCheck['results'] | null>(null);

  const commonSymptoms: Symptom[] = [
    { id: 'fever', name: 'Fever', category: 'General', icon: Thermometer, severity: 'moderate', color: 'bg-red-100 text-red-600' },
    { id: 'headache', name: 'Headache', category: 'Neurological', icon: Brain, severity: 'mild', color: 'bg-purple-100 text-purple-600' },
    { id: 'cough', name: 'Cough', category: 'Respiratory', icon: Activity, severity: 'mild', color: 'bg-blue-100 text-blue-600' },
    { id: 'sore_throat', name: 'Sore Throat', category: 'Respiratory', icon: Activity, severity: 'mild', color: 'bg-blue-100 text-blue-600' },
    { id: 'nausea', name: 'Nausea', category: 'Digestive', icon: Activity, severity: 'moderate', color: 'bg-green-100 text-green-600' },
    { id: 'chest_pain', name: 'Chest Pain', category: 'Cardiovascular', icon: Heart, severity: 'severe', color: 'bg-red-100 text-red-600' },
    { id: 'shortness_breath', name: 'Shortness of Breath', category: 'Respiratory', icon: Activity, severity: 'severe', color: 'bg-red-100 text-red-600' },
    { id: 'dizziness', name: 'Dizziness', category: 'Neurological', icon: Brain, severity: 'moderate', color: 'bg-purple-100 text-purple-600' },
    { id: 'fatigue', name: 'Fatigue', category: 'General', icon: Clock, severity: 'mild', color: 'bg-yellow-100 text-yellow-600' },
    { id: 'abdominal_pain', name: 'Abdominal Pain', category: 'Digestive', icon: Activity, severity: 'moderate', color: 'bg-green-100 text-green-600' },
    { id: 'skin_rash', name: 'Skin Rash', category: 'Dermatological', icon: Activity, severity: 'mild', color: 'bg-pink-100 text-pink-600' },
    { id: 'joint_pain', name: 'Joint Pain', category: 'Musculoskeletal', icon: Activity, severity: 'moderate', color: 'bg-orange-100 text-orange-600' }
  ];

  const filteredSymptoms = commonSymptoms.filter(symptom =>
    symptom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    symptom.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Analyze symptoms mutation
  const analyzeSymptomsMutation = useMutation({
    mutationFn: async (data: { symptoms: string[]; duration: string; severity: string; additionalInfo: string }) => {
      const response = await fetch('/api/symptom-checker/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to analyze symptoms');
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data.results);
      toast({
        title: "Analysis Complete",
        description: "Your symptoms have been analyzed",
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze symptoms. Please try again.",
        variant: "destructive"
      });
    }
  });

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleAnalyze = () => {
    if (selectedSymptoms.length === 0) {
      toast({
        title: "No Symptoms Selected",
        description: "Please select at least one symptom to analyze",
        variant: "destructive"
      });
      return;
    }

    analyzeSymptomsMutation.mutate({
      symptoms: selectedSymptoms,
      duration,
      severity,
      additionalInfo
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-600';
      case 'medium': return 'bg-yellow-100 text-yellow-600';
      case 'low': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="mobile-container bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/")}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold">Symptom Checker</h1>
            <p className="text-sm text-green-100">AI-powered health assessment</p>
          </div>
          
          <div className="w-10" /> {/* Spacer for balance */}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Important Notice */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Medical Disclaimer</p>
                <p className="text-xs text-amber-700 mt-1">
                  This tool provides general health information only. Always consult a healthcare professional for proper diagnosis and treatment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Symptom Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-green-600" />
              <span>Select Your Symptoms</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search symptoms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Symptoms Grid */}
            <div className="grid grid-cols-1 gap-3">
              {filteredSymptoms.map((symptom) => (
                <div
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedSymptoms.includes(symptom.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${symptom.color}`}>
                        <symptom.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{symptom.name}</p>
                        <p className="text-xs text-gray-500">{symptom.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {symptom.severity}
                      </Badge>
                      <Checkbox checked={selectedSymptoms.includes(symptom.id)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">How long have you had these symptoms?</label>
              <Input
                placeholder="e.g., 2 days, 1 week, ongoing"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">How would you rate the severity?</label>
              <div className="grid grid-cols-3 gap-2">
                {['Mild', 'Moderate', 'Severe'].map((level) => (
                  <Button
                    key={level}
                    variant={severity === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSeverity(level)}
                    className="text-xs"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Any additional information?</label>
              <Textarea
                placeholder="Describe any other relevant details, triggers, or concerns..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Analyze Button */}
        <Button 
          onClick={handleAnalyze}
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={analyzeSymptomsMutation.isPending || selectedSymptoms.length === 0}
        >
          {analyzeSymptomsMutation.isPending ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
          ) : (
            <Stethoscope className="w-4 h-4 mr-2" />
          )}
          Analyze Symptoms
        </Button>

        {/* Results */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Assessment Results</span>
                <Badge className={getUrgencyColor(results.urgencyLevel)}>
                  {results.urgencyLevel.toUpperCase()} PRIORITY
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Possible Conditions */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Possible Conditions:</h3>
                <div className="space-y-2">
                  {results.possibleConditions.map((condition, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">{condition}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Recommendations:</h3>
                <div className="space-y-2">
                  {results.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Steps */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Next Steps:</h3>
                <div className="space-y-2">
                  {results.nextSteps.map((step, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Link href="/consultation">
                  <Button variant="outline" className="w-full">
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Consult Doctor
                  </Button>
                </Link>
                <Link href="/pharmacy">
                  <Button variant="outline" className="w-full">
                    <Pill className="w-4 h-4 mr-2" />
                    Find Medicine
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}