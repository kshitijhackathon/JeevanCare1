import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  FileImage, 
  Download, 
  MapPin, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  FileText,
  Brain,
  Loader2
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface PredictionResult {
  condition: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendations: string[];
  treatment: string[];
}

interface AnalysisReport {
  patient_name: string;
  scan_type: string;
  predictions: PredictionResult[];
  summary: string;
  recommendations: string[];
  generated_at: string;
}

export default function MedicalScan() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [scanType, setScanType] = useState<string>("xray");
  const [patientName, setPatientName] = useState<string>("");
  const [showDoctorMap, setShowDoctorMap] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/gzip'];
      const validExtensions = ['.jpg', '.jpeg', '.png', '.nii.gz'];
      
      const fileName = file.name.toLowerCase();
      const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
      
      if (!validTypes.includes(file.type) && !hasValidExtension) {
        toast({
          title: "Invalid File Type",
          description: "Please upload JPG, PNG, or NII.GZ files only.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl("");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !patientName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a file and enter patient name.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setPredictions([]);
    setReport(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('scan_type', scanType);

      const response = await fetch('/api/medical-scan/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      setPredictions(result.predictions || []);

      toast({
        title: "Analysis Complete",
        description: "Medical scan analysis completed successfully.",
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze medical scan.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateReport = async () => {
    if (predictions.length === 0 || !patientName.trim()) {
      toast({
        title: "Cannot Generate Report",
        description: "No analysis results available or missing patient name.",
        variant: "destructive",
      });
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/medical-scan/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_name: patientName,
          scan_type: scanType,
          predictions: predictions,
        }),
      });

      if (!response.ok) {
        throw new Error(`Report generation failed: ${response.statusText}`);
      }

      const reportData = await response.json();
      setReport(reportData);

      toast({
        title: "Report Generated",
        description: "Medical report has been generated successfully.",
      });

    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Report Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate medical report.",
        variant: "destructive",
      });
    }
  };

  const downloadReport = async () => {
    if (!report) return;

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/medical-scan/download-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical_report_${patientName}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Complete",
        description: "Medical report downloaded successfully.",
      });

    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the medical report.",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
          <h1 className="text-xl font-semibold">Medical Image Analysis</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileImage className="w-5 h-5" />
              <span>Upload Medical Image</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Patient Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Name
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter patient name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Scan Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scan Type
              </label>
              <select
                value={scanType}
                onChange={(e) => setScanType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="xray">X-Ray</option>
                <option value="ct">CT Scan</option>
                <option value="mri">MRI</option>
                <option value="ultrasound">Ultrasound</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.nii.gz"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-64 mx-auto rounded-lg"
                  />
                  <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                </div>
              ) : selectedFile ? (
                <div className="space-y-3">
                  <FileImage className="w-16 h-16 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">{selectedFile.name}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-16 h-16 mx-auto text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-700">Upload Medical Image</p>
                    <p className="text-sm text-gray-500">JPG, PNG, or NII.GZ files supported</p>
                  </div>
                </div>
              )}
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mt-3"
              >
                <Upload className="w-4 h-4 mr-2" />
                {selectedFile ? 'Change File' : 'Select File'}
              </Button>
            </div>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={!selectedFile || !patientName.trim() || isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {predictions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Analysis Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {predictions.map((prediction, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{prediction.condition}</h3>
                    <Badge className={getSeverityColor(prediction.severity)}>
                      {prediction.severity.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">Confidence:</span>
                      <span className="text-sm text-gray-900">{(prediction.confidence * 100).toFixed(1)}%</span>
                    </div>
                    
                    <p className="text-sm text-gray-700">{prediction.description}</p>
                    
                    {prediction.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Recommendations:</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {prediction.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <Separator />
              
              <div className="flex space-x-3">
                <Button onClick={generateReport} variant="outline" className="flex-1">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                
                <Button onClick={() => setShowDoctorMap(true)} variant="outline" className="flex-1">
                  <MapPin className="w-4 h-4 mr-2" />
                  Find Doctors
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Report */}
        {report && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Medical Report</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Patient:</span>
                    <span className="ml-2 text-gray-900">{report.patient_name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Scan Type:</span>
                    <span className="ml-2 text-gray-900">{report.scan_type}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">Generated:</span>
                    <span className="ml-2 text-gray-900">{new Date(report.generated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">{report.summary}</p>
              </div>

              <Button onClick={downloadReport} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download PDF Report
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Doctor Map */}
        {showDoctorMap && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <span>Nearby Specialists</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDoctorMap(false)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">Interactive map showing nearby medical specialists will be displayed here.</p>
                <p className="text-sm text-gray-500 mt-2">Enable location access for personalized results.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}