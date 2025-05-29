import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, Zap, TrendingUp } from 'lucide-react';

interface SmartSymptomDisplayProps {
  analysis: {
    detectedSymptoms: Array<{
      category: string;
      emoji: string;
      keywords: string[];
      severity: string;
      description: string;
    }>;
    contextualInfo: {
      categories: string[];
      severity: string;
      timeContext: string | null;
      duration: string | null;
      triggers: string[];
      emergencyFlag: boolean;
    };
    analysisConfidence: number;
  };
  patientDetails: {
    language: string;
  };
}

export default function SmartSymptomDisplay({ analysis, patientDetails }: SmartSymptomDisplayProps) {
  const { detectedSymptoms, contextualInfo, analysisConfidence } = analysis;

  if (detectedSymptoms.length === 0) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'mild': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Emergency Alert */}
      {contextualInfo.emergencyFlag && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">
            {patientDetails.language === 'hindi' 
              ? '🚨 आपातकालीन स्थिति - तुरंत चिकित्सा सहायता लें!'
              : '🚨 Emergency Situation - Seek immediate medical attention!'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Main Analysis Card */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-800">
              🧠 {patientDetails.language === 'hindi' ? 'स्मार्ट लक्षण विश्लेषण' : 'Smart Symptom Analysis'}
            </h3>
            <Badge variant="outline" className={`${getConfidenceColor(analysisConfidence)} border-current`}>
              {analysisConfidence}% {patientDetails.language === 'hindi' ? 'विश्वसनीयता' : 'Confidence'}
            </Badge>
          </div>

          {/* Detected Symptoms */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {patientDetails.language === 'hindi' ? 'पहचाने गए लक्षण:' : 'Detected Symptoms:'}
            </h4>
            
            <div className="grid gap-3">
              {detectedSymptoms.map((symptom, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getSeverityColor(symptom.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{symptom.emoji}</span>
                      <div>
                        <h5 className="font-semibold capitalize">{symptom.category}</h5>
                        <p className="text-sm opacity-90">{symptom.description}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {symptom.severity === 'mild' && (patientDetails.language === 'hindi' ? 'हल्का' : 'Mild')}
                      {symptom.severity === 'moderate' && (patientDetails.language === 'hindi' ? 'मध्यम' : 'Moderate')}
                      {symptom.severity === 'severe' && (patientDetails.language === 'hindi' ? 'गंभीर' : 'Severe')}
                    </Badge>
                  </div>
                  
                  {/* Keywords found */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {symptom.keywords.map((keyword, idx) => (
                      <span key={idx} className="text-xs bg-white bg-opacity-60 px-2 py-1 rounded">
                        "{keyword}"
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contextual Information */}
          {(contextualInfo.timeContext || contextualInfo.duration || contextualInfo.triggers.length > 0) && (
            <div className="mt-4 p-3 bg-white bg-opacity-60 rounded-lg">
              <h4 className="font-medium text-gray-700 flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                {patientDetails.language === 'hindi' ? 'संदर्भ जानकारी:' : 'Contextual Information:'}
              </h4>
              
              <div className="space-y-2 text-sm">
                {contextualInfo.timeContext && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">⏰ {patientDetails.language === 'hindi' ? 'समय:' : 'Time:'}</span>
                    <span className="capitalize">{contextualInfo.timeContext}</span>
                  </div>
                )}
                
                {contextualInfo.duration && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">📅 {patientDetails.language === 'hindi' ? 'अवधि:' : 'Duration:'}</span>
                    <span className="capitalize">
                      {contextualInfo.duration === 'acute' 
                        ? (patientDetails.language === 'hindi' ? 'अचानक शुरू' : 'Sudden onset')
                        : (patientDetails.language === 'hindi' ? 'लंबे समय से' : 'Long term')
                      }
                    </span>
                  </div>
                )}
                
                {contextualInfo.triggers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">🎯 {patientDetails.language === 'hindi' ? 'कारक:' : 'Triggers:'}</span>
                    <span className="capitalize">{contextualInfo.triggers.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Overall Severity Indicator */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">
                {patientDetails.language === 'hindi' ? 'समग्र गंभीरता:' : 'Overall Severity:'}
              </span>
            </div>
            <Badge className={getSeverityColor(contextualInfo.severity)}>
              {contextualInfo.severity === 'mild' && (patientDetails.language === 'hindi' ? 'हल्का' : 'Mild')}
              {contextualInfo.severity === 'moderate' && (patientDetails.language === 'hindi' ? 'मध्यम' : 'Moderate')}
              {contextualInfo.severity === 'severe' && (patientDetails.language === 'hindi' ? 'गंभीर' : 'Severe')}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}