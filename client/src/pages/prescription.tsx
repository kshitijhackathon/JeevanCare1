import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Share,
  Calendar,
  User,
  Phone,
  Pill,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Prescription {
  id: number;
  patientName: string;
  age: number;
  gender: string;
  doctorName: string;
  doctorLicense: string;
  diagnosis: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  date: string;
  validUntil: string;
  notes: string;
}

interface PrescriptionForm {
  diagnosis: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  notes: string;
}

export default function Prescription() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<PrescriptionForm>({
    diagnosis: "",
    medications: [
      { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
    ],
    notes: ""
  });

  // Fetch user's prescriptions
  const { data: prescriptions, isLoading } = useQuery<Prescription[]>({
    queryKey: ['/api/prescriptions'],
  });

  // Generate prescription mutation
  const generatePrescriptionMutation = useMutation({
    mutationFn: async (data: PrescriptionForm) => {
      const response = await fetch('/api/prescriptions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to generate prescription');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Prescription Generated",
        description: "Your prescription has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
      // Reset form
      setFormData({
        diagnosis: "",
        medications: [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }],
        notes: ""
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate prescription. Please try again.",
        variant: "destructive"
      });
    }
  });

  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }]
    }));
  };

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const updateMedication = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generatePrescriptionMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="mobile-container bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="mobile-container bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 shadow-lg">
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
            <h1 className="text-xl font-bold">Digital Prescription</h1>
            <p className="text-sm text-purple-100">Generate & manage prescriptions</p>
          </div>
          
          <div className="w-10" /> {/* Spacer for balance */}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Generate New Prescription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span>Generate New Prescription</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Diagnosis</label>
                <Textarea
                  placeholder="Enter diagnosis or condition..."
                  value={formData.diagnosis}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Medications</label>
                {formData.medications.map((medication, index) => (
                  <Card key={index} className="mb-3 border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-sm">Medication {index + 1}</span>
                        {formData.medications.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMedication(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <Input
                          placeholder="Medicine name"
                          value={medication.name}
                          onChange={(e) => updateMedication(index, 'name', e.target.value)}
                          required
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Dosage (e.g., 500mg)"
                            value={medication.dosage}
                            onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                            required
                          />
                          <Input
                            placeholder="Frequency (e.g., 2x daily)"
                            value={medication.frequency}
                            onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                            required
                          />
                        </div>
                        <Input
                          placeholder="Duration (e.g., 7 days)"
                          value={medication.duration}
                          onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                          required
                        />
                        <Input
                          placeholder="Special instructions (e.g., take with food)"
                          value={medication.instructions}
                          onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addMedication}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Medication
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes</label>
                <Textarea
                  placeholder="Any additional instructions or notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={generatePrescriptionMutation.isPending}
              >
                {generatePrescriptionMutation.isPending ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Generate Prescription
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Prescriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {prescriptions && prescriptions.length > 0 ? (
              <div className="space-y-3">
                {prescriptions.slice(0, 5).map((prescription) => (
                  <Card key={prescription.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-sm">{prescription.diagnosis}</h3>
                          <p className="text-xs text-gray-600">Dr. {prescription.doctorName}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(prescription.date).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">Medications:</p>
                        {prescription.medications.map((med, index) => (
                          <div key={index} className="text-xs text-gray-600 mb-1">
                            <Pill className="w-3 h-3 inline mr-1" />
                            {med.name} - {med.dosage}, {med.frequency} for {med.duration}
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Share className="w-3 h-3 mr-1" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No prescriptions yet</p>
                <p className="text-sm text-gray-400">
                  Generate your first digital prescription above
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Digital Prescription Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Benefits of Digital Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">Instant generation and sharing</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">Digital signature and verification</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">Easy pharmacy integration</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">Secure cloud storage</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}