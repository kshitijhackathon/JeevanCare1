import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Printer, FileText, Calendar, User, Phone, MapPin, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

  const downloadPDF = async () => {
    if (!prescriptionRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(prescriptionRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`prescription_${prescriptionData.patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Download Complete",
        description: "Prescription has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "Could not generate PDF. Please try again.",
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