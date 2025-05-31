import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Printer, FileText, Calendar, User, Phone, MapPin, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Lightweight PDF generation using browser's print API

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  timing: string;
}

interface Test {
  name: string;
  type: string;
  urgency: string;
  instructions: string;
}

interface Injection {
  name: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
}

interface PrescriptionData {
  patientName: string;
  age: string;
  gender: string;
  bloodGroup?: string;
  phoneNumber: string;
  city: string;
  symptoms: string;
  diagnosis: string;
  medicines: Medicine[];
  tests: Test[];
  injections: Injection[];
  followUp: string;
  doctorNote: string;
  nextVisit: string;
}

interface PrescriptionGeneratorProps {
  prescriptionData: PrescriptionData;
  onClose: () => void;
}

export default function PrescriptionGenerator({ prescriptionData, onClose }: PrescriptionGeneratorProps) {
  const { toast } = useToast();
  const prescriptionRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadPDF = () => {
    setIsGenerating(true);
    try {
      // Use browser's built-in print functionality
      const printWindow = window.open('', '_blank');
      const prescriptionHTML = prescriptionRef.current?.innerHTML || '';
      
      printWindow?.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Prescription - ${prescriptionData.patientName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .prescription-header { background: #5BC0EB; color: white; padding: 20px; text-align: center; }
            .patient-info { margin: 20px 0; }
            .medicines-list { margin: 20px 0; }
            .medicine-item { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
            @media print { 
              body { margin: 0; }
              .print-only { display: block; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${prescriptionHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
        </html>
      `);
      
      toast({
        title: "Print Dialog Opened",
        description: "Use your browser's print dialog to save as PDF.",
      });
    } catch (error) {
      console.error('Error opening print dialog:', error);
      toast({
        title: "Print Failed",
        description: "Could not open print dialog. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const printPrescription = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={onClose}>
            ← Back to Consultation
          </Button>
          <div className="flex space-x-2">
            <Button onClick={printPrescription} variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={downloadPDF} disabled={isGenerating}>
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>

        {/* Prescription Content */}
        <div ref={prescriptionRef} className="bg-white p-8 rounded-lg shadow-lg print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-6 rounded-t-lg mb-6">
              <h1 className="text-2xl font-bold">PRESCRIPTION</h1>
            </div>
            
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-600">Jeevancare</h2>
                  <p className="text-sm text-gray-600">AI-Powered Healthcare</p>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Patient Name</p>
                  <p className="font-semibold">{prescriptionData.patientName}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Age</p>
                <p className="font-semibold">{prescriptionData.age} years</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">{new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Blood Group</p>
                <p className="font-semibold">{prescriptionData.bloodGroup || 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Gender</p>
                <p className="font-semibold">{prescriptionData.gender}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold">{prescriptionData.phoneNumber}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Diagnosis */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-blue-600">Chief Complaint & Diagnosis</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded">{prescriptionData.symptoms}</p>
            <p className="text-gray-800 font-medium mt-2">{prescriptionData.diagnosis}</p>
          </div>

          {/* Medicines */}
          {prescriptionData.medicines.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-600">Rx (Medicines)</h3>
              <div className="space-y-3">
                {prescriptionData.medicines.map((medicine, index) => (
                  <div key={index} className="border border-gray-200 p-3 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800">{index + 1}. {medicine.name}</h4>
                      <Badge variant="outline">{medicine.timing}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Dosage:</span>
                        <span className="ml-1 font-medium">{medicine.dosage}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Frequency:</span>
                        <span className="ml-1 font-medium">{medicine.frequency}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-1 font-medium">{medicine.duration}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Instructions:</span> {medicine.instructions}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tests */}
          {prescriptionData.tests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-600">Laboratory Tests</h3>
              <div className="space-y-2">
                {prescriptionData.tests.map((test, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <div>
                      <span className="font-medium">{index + 1}. {test.name}</span>
                      <span className="text-sm text-gray-600 ml-2">({test.type})</span>
                    </div>
                    <Badge variant={test.urgency === 'urgent' ? 'destructive' : 'secondary'}>
                      {test.urgency}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Injections */}
          {prescriptionData.injections.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-600">Injections</h3>
              <div className="space-y-3">
                {prescriptionData.injections.map((injection, index) => (
                  <div key={index} className="border border-red-200 p-3 rounded bg-red-50">
                    <h4 className="font-semibold text-gray-800">{index + 1}. {injection.name}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                      <div>
                        <span className="text-gray-600">Dosage:</span>
                        <span className="ml-1 font-medium">{injection.dosage}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Route:</span>
                        <span className="ml-1 font-medium">{injection.route}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Frequency:</span>
                        <span className="ml-1 font-medium">{injection.frequency}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-1 font-medium">{injection.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-blue-600">Follow-up Instructions</h3>
            <p className="text-gray-700 bg-yellow-50 p-3 rounded">{prescriptionData.followUp}</p>
            {prescriptionData.nextVisit && (
              <div className="flex items-center space-x-2 mt-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-sm">Next Visit: {prescriptionData.nextVisit}</span>
              </div>
            )}
          </div>

          {/* Doctor's Note */}
          {prescriptionData.doctorNote && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-blue-600">Doctor's Note</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded italic">{prescriptionData.doctorNote}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <p>Generated by AI Doctor Consultation</p>
                <p>Jeevancare - Digital Healthcare Platform</p>
              </div>
              <div className="text-right">
                <div className="w-20 h-20 bg-gray-200 rounded border-2 border-dashed border-gray-400 flex items-center justify-center">
                  <span className="text-xs text-gray-500">QR Code</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">www.jeevancare.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}