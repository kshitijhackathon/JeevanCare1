import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft,
  Upload,
  FileText,
  Brain,
  Stethoscope,
  Clock,
  Download,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Pill,
  Activity
} from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface MedicalRecord {
  id: number;
  fileName: string;
  fileType: string;
  uploadDate: string;
  aiAnalysis?: {
    conditions: string[];
    medications: string[];
    allergies: string[];
    recommendations: string[];
    summary: string;
    riskLevel: 'low' | 'medium' | 'high';
    nextSteps: string[];
  };
  originalText?: string;
  status: 'processing' | 'analyzed' | 'error';
}

export default function MedicalRecords() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch medical records
  const { data: records, isLoading } = useQuery<MedicalRecord[]>({
    queryKey: ['/api/medical-records'],
    queryFn: async () => {
      const response = await fetch('/api/medical-records');
      if (!response.ok) throw new Error('Failed to fetch records');
      return response.json();
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/medical-records/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: "Your medical record is being analyzed by AI...",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/medical-records'] });
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    }
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
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
          <h1 className="text-xl font-semibold">Medical Records</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Upload Medical Records</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Upload your medical reports, prescriptions, or lab results for AI analysis
            </p>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-3">
                  <FileText className="w-12 h-12 text-blue-600 mx-auto" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex space-x-2 justify-center">
                    <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                      {uploadMutation.isPending ? 'Uploading...' : 'Upload & Analyze'}
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedFile(null)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="font-medium text-gray-900">Drop files here or click to upload</p>
                    <p className="text-sm text-gray-500">
                      Supports PDF, JPG, PNG, DOC files up to 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Button variant="outline" className="pointer-events-none">
                      Choose File
                    </Button>
                  </label>
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-gray-500">
              <p className="font-medium mb-1">🤖 AI Analysis includes:</p>
              <ul className="space-y-1">
                <li>• Medical condition identification</li>
                <li>• Medication and treatment analysis</li>
                <li>• Health recommendations</li>
                <li>• Risk assessment and alerts</li>
                <li>• Prescription suggestions</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Records List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Medical Records</span>
              <Badge variant="outline">{records?.length || 0} records</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="flex space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : records && records.length > 0 ? (
              <div className="space-y-4">
                {records.map((record) => (
                  <Card key={record.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-medium">{record.fileName}</h3>
                              <p className="text-sm text-gray-500">
                                {new Date(record.uploadDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge 
                              className={
                                record.status === 'analyzed' 
                                  ? 'bg-green-100 text-green-800'
                                  : record.status === 'processing'
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {record.status}
                            </Badge>
                          </div>

                          {record.aiAnalysis && (
                            <div className="space-y-3">
                              <Separator />
                              
                              {/* AI Analysis Summary */}
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Brain className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium text-blue-900">AI Analysis</span>
                                  <Badge className={getRiskColor(record.aiAnalysis.riskLevel)}>
                                    {record.aiAnalysis.riskLevel} risk
                                  </Badge>
                                </div>
                                <p className="text-sm text-blue-800 mb-3">
                                  {record.aiAnalysis.summary}
                                </p>
                              </div>

                              {/* Conditions */}
                              {record.aiAnalysis.conditions.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-sm mb-2 flex items-center">
                                    <Stethoscope className="w-4 h-4 mr-1" />
                                    Detected Conditions
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {record.aiAnalysis.conditions.map((condition, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {condition}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Medications */}
                              {record.aiAnalysis.medications.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-sm mb-2 flex items-center">
                                    <Pill className="w-4 h-4 mr-1" />
                                    Medications
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {record.aiAnalysis.medications.map((med, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs bg-green-50">
                                        {med}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Recommendations */}
                              {record.aiAnalysis.recommendations.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-sm mb-2 flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    AI Recommendations
                                  </h4>
                                  <ul className="space-y-1">
                                    {record.aiAnalysis.recommendations.map((rec, idx) => (
                                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                                        <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                        {rec}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex space-x-2 pt-2">
                                <Button size="sm" variant="outline">
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Full
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </Button>
                                <Link href={`/doctor-escalation?condition=${record.aiAnalysis.conditions[0]}`}>
                                  <Button size="sm">
                                    <Stethoscope className="w-4 h-4 mr-1" />
                                    Find Doctor
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No medical records yet</p>
                <p className="text-sm text-gray-400">Upload your first medical record to get AI analysis</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benefits Summary */}
        {records && records.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Health Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {records.filter(r => r.aiAnalysis?.riskLevel === 'low').length}
                  </p>
                  <p className="text-sm text-green-700">Low Risk Reports</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {records.reduce((acc, r) => acc + (r.aiAnalysis?.recommendations.length || 0), 0)}
                  </p>
                  <p className="text-sm text-blue-700">AI Recommendations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}