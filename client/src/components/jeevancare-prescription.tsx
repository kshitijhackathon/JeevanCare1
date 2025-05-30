import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Print } from 'lucide-react';
import jsPDF from 'jspdf';

interface PrescriptionData {
  patientName: string;
  age: string;
  date: string;
  bloodGroup: string;
  gender: string;
  symptoms: string[];
  medicines: Array<{
    name: string;
    composition: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    timing: string;
  }>;
  tests: Array<{
    name: string;
    type: string;
    urgency: string;
    instructions: string;
  }>;
  doctorAdvice: string[];
  followUp: string;
}

interface PrescriptionProps {
  data: PrescriptionData;
  onClose: () => void;
}

export function JeevancarePrescription({ data, onClose }: PrescriptionProps) {
  const downloadPDF = () => {
    const pdf = new jsPDF();
    
    // Header
    pdf.setFillColor(91, 192, 235);
    pdf.rect(0, 0, 210, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text('PRESCRIPTION', 105, 20, { align: 'center' });
    
    // Logo area
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.text('Jeevancare', 105, 55, { align: 'center' });
    
    // Patient details
    let yPos = 80;
    pdf.setFontSize(12);
    pdf.text(`Patient Name: ${data.patientName}`, 20, yPos);
    yPos += 10;
    pdf.text(`Age: ${data.age}`, 20, yPos);
    yPos += 10;
    pdf.text(`Date: ${data.date}`, 20, yPos);
    yPos += 10;
    pdf.text(`Blood Group: ${data.bloodGroup}`, 20, yPos);
    yPos += 10;
    pdf.text(`Gender: ${data.gender}`, 20, yPos);
    yPos += 20;
    
    // Symptoms
    pdf.setFontSize(14);
    pdf.text('Symptoms:', 20, yPos);
    yPos += 10;
    pdf.setFontSize(10);
    data.symptoms.forEach(symptom => {
      pdf.text(`• ${symptom}`, 25, yPos);
      yPos += 8;
    });
    yPos += 10;
    
    // Medicines
    pdf.setFontSize(14);
    pdf.text('Prescribed Medicines:', 20, yPos);
    yPos += 10;
    pdf.setFontSize(10);
    data.medicines.forEach((med, index) => {
      pdf.text(`${index + 1}. ${med.name}`, 25, yPos);
      yPos += 6;
      pdf.text(`   ${med.dosage} - ${med.frequency} - ${med.duration}`, 25, yPos);
      yPos += 6;
      pdf.text(`   ${med.instructions} (${med.timing})`, 25, yPos);
      yPos += 10;
    });
    
    // Footer
    pdf.text('Dr. Saarthi AI - Digital Healthcare Assistant', 105, 280, { align: 'center' });
    pdf.text('www.jeevancare.com', 105, 290, { align: 'center' });
    
    pdf.save(`prescription_${data.patientName}_${data.date}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardContent className="p-0">
          {/* Prescription Header */}
          <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-6 rounded-t-lg">
            <h1 className="text-3xl font-bold text-center mb-2">PRESCRIPTION</h1>
          </div>

          {/* Jeevancare Logo Section */}
          <div className="text-center py-4 border-b">
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-xl">J</span>
              </div>
              <h2 className="text-2xl font-semibold text-blue-600">Jeevancare</h2>
            </div>
            <p className="text-sm text-gray-600">Digital Healthcare Assistant</p>
          </div>

          {/* Patient Information */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Patient Name</label>
                <div className="border-b border-gray-300 pb-1">
                  <span className="font-medium">{data.patientName}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Age</label>
                <div className="border-b border-gray-300 pb-1">
                  <span className="font-medium">{data.age}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Date</label>
                <div className="border-b border-gray-300 pb-1">
                  <span className="font-medium">{data.date}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Blood Group</label>
                <div className="border-b border-gray-300 pb-1">
                  <span className="font-medium">{data.bloodGroup}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Gender</label>
              <div className="border-b border-gray-300 pb-1">
                <span className="font-medium">{data.gender}</span>
              </div>
            </div>

            {/* Symptoms Section */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Symptoms Noted:</h3>
              <div className="bg-gray-50 p-4 rounded">
                <ul className="list-disc list-inside space-y-1">
                  {data.symptoms.map((symptom, index) => (
                    <li key={index} className="text-sm">{symptom}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Medicines Section */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Prescribed Medicines:</h3>
              <div className="space-y-4">
                {data.medicines.map((medicine, index) => (
                  <div key={index} className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
                    <div className="font-semibold text-blue-800">{index + 1}. {medicine.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{medicine.composition}</div>
                    <div className="text-sm mt-2">
                      <span className="font-medium">Dosage:</span> {medicine.dosage}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Frequency:</span> {medicine.frequency}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Duration:</span> {medicine.duration}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Instructions:</span> {medicine.instructions} ({medicine.timing})
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tests Section */}
            {data.tests.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Recommended Tests:</h3>
                <div className="space-y-2">
                  {data.tests.map((test, index) => (
                    <div key={index} className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
                      <div className="font-medium">{test.name} ({test.type})</div>
                      <div className="text-sm text-gray-600">Urgency: {test.urgency}</div>
                      {test.instructions && (
                        <div className="text-sm mt-1">{test.instructions}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Doctor's Advice */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Doctor's Advice:</h3>
              <div className="bg-green-50 p-4 rounded">
                <ul className="list-disc list-inside space-y-1">
                  {data.doctorAdvice.map((advice, index) => (
                    <li key={index} className="text-sm">{advice}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Follow-up */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Follow-up:</h3>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm">{data.followUp}</p>
              </div>
            </div>

            {/* Warning */}
            <div className="mt-6 bg-red-50 border border-red-200 p-4 rounded">
              <p className="text-sm text-red-800">
                <strong>Important:</strong> यदि इन दवाओं से फर्क नहीं पड़े तो कुछ दिन बाद टेस्ट करवाकर दोबारा दिखा लेना। 
                If these medicines don't help, please get tests done and consult again after a few days.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 rounded-b-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">Dr. Saarthi AI</p>
                <p className="text-sm">Digital Healthcare Assistant</p>
              </div>
              <div className="text-right">
                <p className="text-sm">www.jeevancare.com</p>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded flex items-center justify-center mt-2">
                  <span className="text-xs">QR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-gray-50 flex justify-center space-x-4">
            <Button onClick={downloadPDF} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={() => window.print()} variant="outline">
              <Print className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}