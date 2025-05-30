import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, Check, AlertCircle, Image, Home, ArrowLeft, Brain, Heart, Stethoscope, Eye, Dna, Zap, Bone, Thermometer, BarChart, Scan, AudioWaveform } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";

const imageTypes = [
  {
    id: 'mri_3d',
    name: 'MRI',
    description: '3D MRI scans for volumetric soft tissue analysis',
    icon: Brain,
    color: 'bg-purple-700',
  },
  {
    id: 'xray',
    name: 'X-Ray',
    description: 'Bone fractures, chest screenings, and more',
    icon: Bone,
    color: 'bg-orange-500',
  },
  {
    id: 'ct_2d',
    name: 'CT Scan (2D)',
    description: '2D CT slices for cross-sectional anatomy',
    icon: Scan,
    color: 'bg-indigo-400',
  },
  {
    id: 'ct_3d',
    name: 'CT Scan (tumor)',
    description: '3D reconstructed CT scans for volumetric imaging',
    icon: Scan,
    color: 'bg-indigo-700',
  },
  {
    id: 'ultrasound',
    name: 'Ultrasound',
    description: 'Soft tissue and pregnancy imaging in real-time',
    icon: AudioWaveform,
    color: 'bg-green-500',
  },
];

const ImageTypeSelector = ({ selectedImageType, setSelectedImageType }: any) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {imageTypes.map((type) => {
        const IconComponent = type.icon;
        const isSelected = selectedImageType === type.id;

        return (
          <Card
            key={type.id}
            onClick={() => setSelectedImageType(type.id)}
            className={`cursor-pointer border-2 transition-all duration-300 hover:shadow-lg ${
              isSelected ? 'border-blue-500 ' : 'border-transparent hover:border-slate-200'
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-lg ${type.color} text-white mb-3`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                {isSelected && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                    Selected
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{type.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                {type.description}
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <p className="text-xs text-slate-500">
                {isSelected ? 'Currently selected' : 'Click to select'}
              </p>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

const SegmentedImageViewer = ({ imageUrl, imageType }: any) => {
  if (!imageUrl) return null;

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-3">Image Preview</h3>
      <div className="relative">
        <img
          src={imageUrl}
          alt="Medical scan preview"
          className="w-full max-h-96 object-contain rounded-lg border"
        />
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="bg-black/50 text-white">
            {imageType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default function MedicalScan() {
  const [selectedImageType, setSelectedImageType] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return setError('Please select a file first.');
    if (!selectedImageType) return setError('Please select an image type first.');

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('scan_type', selectedImageType);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/medical-scan/predict', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();

      setProcessedData({
        predictions: result.predictions || null,
        report: result.report,
        disease: result.disease,
        symptoms: result.symptoms || [],
        imagePreview: preview,
        imageType: selectedImageType
      });

      toast({
        title: "Analysis Complete",
        description: "Medical image analysis completed successfully.",
      });

    } catch (err) {
      console.error('Analysis error:', err);
      setError('An error occurred during upload or analysis. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!processedData || !file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('scan_type', selectedImageType || '');
      formData.append('analysis_results', JSON.stringify(processedData));

      const response = await fetch('/api/medical-scan/generate-report', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Report generation failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `medical-report-${selectedImageType}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Report Downloaded",
        description: "Medical report has been downloaded successfully.",
      });

    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Report Generation Failed",
        description: "An error occurred while generating the report.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation('/')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medical Image Analysis</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {!processedData ? (
          <Card className="w-full shadow-md min-h-screen">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Upload Medical Image</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Select Image Type</h3>
                <ImageTypeSelector
                  selectedImageType={selectedImageType}
                  setSelectedImageType={setSelectedImageType}
                />
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div
                className={`border-2 border-dashed rounded-lg p-6 mb-4 transition-colors duration-300 ${
                  preview ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const droppedFile = e.dataTransfer.files[0];
                  if (!droppedFile?.type.startsWith('image/')) {
                    setError('Please upload an image file.');
                    return;
                  }

                  setFile(droppedFile);
                  setError(null);

                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setPreview(reader.result as string);
                  };
                  reader.readAsDataURL(droppedFile);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                />

                {preview ? (
                  <div className="flex flex-col items-center">
                    <div className="relative w-full max-w-xs mx-auto">
                      <img
                        src={preview}
                        alt="Preview"
                        className="object-cover rounded-md w-full max-h-64"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setPreview(null);
                          setError(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{file?.name}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 rounded-full bg-blue-100 mb-3">
                      <Upload className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium mb-1">Drag and drop your medical image here</p>
                    <p className="text-xs text-slate-500 mb-3">or click to browse files</p>
                    <p className="text-xs text-slate-400">
                      Support for DICOM, JPEG, PNG, and TIFF formats
                    </p>
                  </div>
                )}
              </div>

              {uploading && (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Uploading & analyzing...</span>
                    <span className="text-sm font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {preview && (
                <div className="mt-6">
                  <SegmentedImageViewer imageUrl={preview} imageType={selectedImageType} />
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-500">
                  {selectedImageType
                    ? selectedImageType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    : 'Select image type first'}
                </span>
              </div>
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    Processing <span className="animate-pulse">...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4" /> Upload & Analyze
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          // Results Page
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Analysis Results</h2>
              <div className="flex gap-3">
                <Button onClick={handleDownloadReport} variant="outline">
                  Download Report
                </Button>
                <Button onClick={() => setProcessedData(null)} variant="outline">
                  New Analysis
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={processedData.imagePreview}
                    alt="Medical scan"
                    className="w-full h-auto rounded-lg"
                  />
                </CardContent>
              </Card>

              {/* Analysis Results */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {processedData.predictions?.map((prediction: any, index: number) => (
                    <div key={index} className="mb-4 p-4 border rounded-lg">
                      <h3 className="font-semibold text-lg mb-2">{prediction.condition}</h3>
                      <p className="text-gray-600 mb-2">{prediction.description}</p>
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-sm text-gray-500">
                          Confidence: {(prediction.confidence * 100).toFixed(1)}%
                        </span>
                        <Badge variant={
                          prediction.severity === 'high' ? 'destructive' :
                          prediction.severity === 'medium' ? 'default' : 'secondary'
                        }>
                          {prediction.severity} severity
                        </Badge>
                      </div>
                      
                      {prediction.recommendations && (
                        <div className="mb-3">
                          <h4 className="font-medium mb-1">Recommendations:</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {prediction.recommendations.map((rec: string, i: number) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {prediction.treatment && (
                        <div>
                          <h4 className="font-medium mb-1">Treatment Options:</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {prediction.treatment.map((treat: string, i: number) => (
                              <li key={i}>{treat}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}