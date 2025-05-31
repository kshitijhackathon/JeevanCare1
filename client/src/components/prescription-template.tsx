import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionData {
  id: string;
  patientName: string;
  age: string;
  gender: string;
  bloodGroup: string;
  date: string;
  symptoms: string;
  medications: Medication[];
  instructions: string[];
  doctorName: string;
  clinicName: string;
  signature: string;
}

interface PrescriptionTemplateProps {
  prescription: PrescriptionData;
  onDownload?: () => void;
}

export default function PrescriptionTemplate({ prescription, onDownload }: PrescriptionTemplateProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto bg-white">
      {/* Header Section - Blue gradient like the design */}
      <div className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-wide">PRESCRIPTION</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">+</span>
              </div>
            </div>
            <span className="text-xl font-semibold">Jeevancare</span>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-gray-900">Patient Name</label>
            <div className="mt-1 p-2 border-b-2 border-gray-400 bg-gray-50 font-semibold text-gray-900">
              {prescription.patientName}
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-900">Age</label>
            <div className="mt-1 p-2 border-b-2 border-gray-400 bg-gray-50 font-semibold text-gray-900">
              {prescription.age}
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-900">Date</label>
            <div className="mt-1 p-2 border-b-2 border-gray-400 bg-gray-50 font-semibold text-gray-900">
              {prescription.date}
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-900">Blood Group</label>
            <div className="mt-1 p-2 border-b-2 border-gray-400 bg-gray-50 font-semibold text-gray-900">
              {prescription.bloodGroup}
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-900">Gender</label>
            <div className="mt-1 p-2 border-b-2 border-gray-400 bg-gray-50 font-semibold text-gray-900">
              {prescription.gender}
            </div>
          </div>
        </div>

        {/* Symptoms Section */}
        <div className="mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Chief Complaints</h3>
          <div className="p-3 bg-gray-50 rounded border-2 border-gray-300 font-semibold text-gray-900">
            {prescription.symptoms}
          </div>
        </div>

        {/* Medications Section */}
        <div className="mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Prescribed Medications</h3>
          <div className="space-y-3">
            {prescription.medications.map((med, index) => (
              <div key={index} className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-sm font-bold text-gray-900">Medicine</label>
                    <div className="font-bold text-gray-900 text-lg">{med.name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-900">Dosage</label>
                    <div className="font-semibold text-gray-900">{med.dosage}</div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-900">Frequency</label>
                    <div className="font-semibold text-gray-900">{med.frequency}</div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-900">Duration</label>
                    <div className="font-semibold text-gray-900">{med.duration}</div>
                  </div>
                </div>
                <div className="mt-2">
                  <label className="text-sm font-bold text-gray-900">Instructions</label>
                  <div className="text-base font-semibold text-gray-900">{med.instructions}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* General Instructions */}
        <div className="mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3">General Instructions</h3>
          <ul className="space-y-2">
            {prescription.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold text-lg">•</span>
                <span className="font-semibold text-gray-900">{instruction}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Doctor Section */}
        <div className="mt-8 pt-6 border-t-2 border-gray-400">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-base font-bold text-gray-900">Prescribed by</div>
              <div className="font-bold text-gray-900 text-lg">{prescription.doctorName}</div>
              <div className="text-base font-semibold text-gray-900">{prescription.clinicName}</div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-gray-900">Digital Signature</div>
              <div className="font-bold text-gray-900 text-lg">{prescription.signature}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with large Jeevancare logo watermark */}
      <div className="relative p-6 bg-gradient-to-r from-cyan-400 to-blue-500">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-lg p-2">
              <div className="w-full h-full bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white font-bold">QR</span>
              </div>
            </div>
            <div className="text-sm">
              <div>Scan for verification</div>
              <div className="text-blue-100">Prescription ID: {prescription.id}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">www.jeevancare.com</div>
            <div className="text-blue-100 text-sm">Digital Healthcare Platform</div>
          </div>
        </div>
        
        {/* Large watermark logo in background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="w-64 h-64 bg-white rounded-full flex items-center justify-center">
            <div className="w-48 h-48 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-6xl font-bold">+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-gray-50 rounded-b-lg flex space-x-4 justify-center print:hidden">
        <Button onClick={handlePrint} className="flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <span>Print Prescription</span>
        </Button>
        {onDownload && (
          <Button onClick={onDownload} variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </Button>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}