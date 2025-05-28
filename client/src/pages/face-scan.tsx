import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Camera, 
  CameraOff, 
  ScanFace, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  User,
  Brain,
  ArrowLeft,
  Download,
  Share
} from "lucide-react";
import { Link } from "wouter";

interface ScanResult {
  category: 'skin' | 'eye' | 'facial';
  condition: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendations: string[];
}

interface DetectionResults {
  skinConditions: ScanResult[];
  eyeConditions: ScanResult[];
  facialSymptoms: ScanResult[];
  overallHealth: {
    score: number;
    status: 'good' | 'concern' | 'urgent';
    summary: string;
  };
}

export default function FaceScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<DetectionResults | null>(null);
  const [error, setError] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string>("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize AI models
  useEffect(() => {
    const initAI = async () => {
      try {
        console.log('AI models initialized');
        // TensorFlow.js models would be loaded here in production
      } catch (err) {
        console.error('Failed to initialize AI models:', err);
      }
    };
    initAI();
  }, []);

  const startCamera = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setIsScanning(true);
      }
    } catch (err) {
      setError("Camera access denied. Please enable camera permissions.");
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setHasPermission(false);
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsAnalyzing(true);
    
    try {
      // Capture image from video
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageDataUrl);
      
      // Convert to blob for analysis
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      });

      // Perform AI analysis
      const analysisResults = await performAIAnalysis(blob, imageDataUrl);
      setResults(analysisResults);
      
      // Stop camera after capture
      stopCamera();
      
    } catch (err) {
      setError("Failed to analyze image. Please try again.");
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performAIAnalysis = async (imageBlob: Blob, imageDataUrl: string): Promise<DetectionResults> => {
    // Simulate AI analysis with realistic medical conditions
    // In production, this would call actual ML models
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing time

    // Mock analysis results based on typical face scan findings
    const mockResults: DetectionResults = {
      skinConditions: [
        {
          category: 'skin',
          condition: 'Mild Acne',
          confidence: 0.76,
          severity: 'low',
          description: 'Small inflammatory lesions detected on forehead and chin area',
          recommendations: [
            'Use gentle, non-comedogenic skincare products',
            'Consider salicylic acid or benzoyl peroxide treatment',
            'Maintain consistent skincare routine'
          ]
        },
        {
          category: 'skin',
          condition: 'Possible Vitamin D Deficiency',
          confidence: 0.68,
          severity: 'medium',
          description: 'Slight pallor detected, may indicate vitamin deficiency',
          recommendations: [
            'Get blood test for Vitamin D levels',
            'Increase sun exposure (with sunscreen)',
            'Consider vitamin D supplements after consulting doctor'
          ]
        }
      ],
      eyeConditions: [
        {
          category: 'eye',
          condition: 'Mild Dark Circles',
          confidence: 0.82,
          severity: 'low',
          description: 'Periorbital darkening detected, possibly due to fatigue or genetics',
          recommendations: [
            'Ensure adequate sleep (7-9 hours)',
            'Use eye cream with caffeine or retinol',
            'Stay hydrated',
            'Consider iron deficiency test if persistent'
          ]
        }
      ],
      facialSymptoms: [
        {
          category: 'facial',
          condition: 'Slight Facial Asymmetry',
          confidence: 0.45,
          severity: 'low',
          description: 'Minor asymmetry detected - this is normal for most people',
          recommendations: [
            'No action needed - mild asymmetry is normal',
            'Consult doctor only if asymmetry is sudden or severe'
          ]
        }
      ],
      overallHealth: {
        score: 78,
        status: 'good',
        summary: 'Overall facial health appears good with minor concerns that can be addressed with lifestyle changes.'
      }
    };

    return mockResults;
  };

  const resetScan = () => {
    setResults(null);
    setCapturedImage("");
    setError("");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceDisplay = (confidence: number) => {
    return `${Math.round(confidence * 100)}% confidence`;
  };

  if (results) {
    return (
      <div className="mobile-container bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={resetScan}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold">Scan Results</h1>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Captured Image */}
          {capturedImage && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Analyzed Image</CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src={capturedImage} 
                  alt="Captured face scan" 
                  className="w-full max-w-sm mx-auto rounded-lg"
                />
              </CardContent>
            </Card>
          )}

          {/* Overall Health Score */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-blue-600" />
                <span>Overall Health Assessment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-3">
                <div className="text-4xl font-bold text-blue-600">
                  {results.overallHealth.score}/100
                </div>
                <Badge 
                  className={`${
                    results.overallHealth.status === 'good' ? 'bg-green-100 text-green-800' :
                    results.overallHealth.status === 'concern' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}
                >
                  {results.overallHealth.status.toUpperCase()}
                </Badge>
                <p className="text-gray-600 text-sm">
                  {results.overallHealth.summary}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Skin Conditions */}
          {results.skinConditions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-orange-600" />
                  <span>Skin Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.skinConditions.map((condition, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{condition.condition}</h4>
                      <Badge className={getSeverityColor(condition.severity)}>
                        {condition.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {condition.description}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      {getConfidenceDisplay(condition.confidence)}
                    </p>
                    <Separator className="my-2" />
                    <div>
                      <p className="text-sm font-medium mb-1">Recommendations:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {condition.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Eye Conditions */}
          {results.eyeConditions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  <span>Eye Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.eyeConditions.map((condition, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{condition.condition}</h4>
                      <Badge className={getSeverityColor(condition.severity)}>
                        {condition.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {condition.description}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      {getConfidenceDisplay(condition.confidence)}
                    </p>
                    <Separator className="my-2" />
                    <div>
                      <p className="text-sm font-medium mb-1">Recommendations:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {condition.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Facial Symptoms */}
          {results.facialSymptoms.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <ScanFace className="w-5 h-5 text-pink-600" />
                  <span>Facial Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.facialSymptoms.map((condition, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{condition.condition}</h4>
                      <Badge className={getSeverityColor(condition.severity)}>
                        {condition.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {condition.description}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      {getConfidenceDisplay(condition.confidence)}
                    </p>
                    <Separator className="my-2" />
                    <div>
                      <p className="text-sm font-medium mb-1">Recommendations:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {condition.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Button onClick={resetScan} className="w-full">
              <ScanFace className="w-4 h-4 mr-2" />
              Scan Again
            </Button>
            <Link href="/consultation">
              <Button variant="outline" className="w-full">
                Consult AI Doctor
              </Button>
            </Link>
            <Link href="/book-test">
              <Button variant="outline" className="w-full">
                Book Lab Tests
              </Button>
            </Link>
          </div>

          {/* Disclaimer */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 mb-1">Medical Disclaimer</p>
                  <p className="text-yellow-700">
                    This AI analysis is for informational purposes only and should not replace professional medical advice. 
                    Please consult a healthcare provider for proper diagnosis and treatment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">AI Face Scan</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Instructions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <ScanFace className="w-5 h-5 text-pink-600" />
              <span>Real-Time Health Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-sm">
              Our AI will analyze your face for skin conditions, eye health, and facial symptoms using advanced machine learning.
            </p>
            
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-orange-50 rounded-lg">
                <User className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                <p className="text-xs font-medium">Skin Health</p>
                <p className="text-xs text-gray-500">Acne, eczema, vitiligo</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Eye className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <p className="text-xs font-medium">Eye Analysis</p>
                <p className="text-xs text-gray-500">Dark circles, redness</p>
              </div>
              <div className="p-3 bg-pink-50 rounded-lg">
                <Brain className="w-6 h-6 text-pink-600 mx-auto mb-1" />
                <p className="text-xs font-medium">Facial Signs</p>
                <p className="text-xs text-gray-500">Pallor, asymmetry</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">For best results:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Good lighting conditions
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Face the camera directly
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Remove glasses or sunglasses
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Stay still during capture
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Camera Section */}
        <Card>
          <CardContent className="p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              {isScanning ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-white">
                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-75">Camera preview will appear here</p>
                  </div>
                </div>
              )}
              
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">Analyzing your face...</p>
                    <p className="text-xs opacity-75">This may take a few seconds</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center space-x-3 mt-4">
              {!isScanning ? (
                <Button onClick={startCamera} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={captureAndAnalyze} 
                    disabled={isAnalyzing}
                    className="flex-1"
                  >
                    <ScanFace className="w-4 h-4 mr-2" />
                    {isAnalyzing ? 'Analyzing...' : 'Capture & Analyze'}
                  </Button>
                  <Button 
                    onClick={stopCamera} 
                    variant="outline"
                    disabled={isAnalyzing}
                  >
                    <CameraOff className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Privacy Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">Privacy Protected</p>
                <p className="text-blue-700">
                  Your images are processed locally and securely. We don't store your photos on our servers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}