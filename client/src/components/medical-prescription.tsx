import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Printer, ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface MedicalPrescriptionProps {
  patientName: string;
  age: string;
  date: string;
  bloodGroup: string;
  gender: string;
  symptoms: string;
  diagnosis: string;
  medicines: Medicine[];
}

const MedicalPrescription: React.FC<MedicalPrescriptionProps> = ({
  patientName,
  age,
  date,
  bloodGroup,
  gender,
  symptoms,
  diagnosis,
  medicines
}) => {
  const [, setLocation] = useLocation();

  const handleDownload = () => {
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOrderMedicines = () => {
    // Store prescription data for medicine ordering
    sessionStorage.setItem('prescriptionMedicines', JSON.stringify(medicines));
    setLocation('/medicine-delivery');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mb-6 print:hidden">
        <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
        <Button onClick={handleOrderMedicines} className="bg-green-600 hover:bg-green-700">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Order Medicines
        </Button>
      </div>

      {/* Prescription Document */}
      <Card className="w-full max-w-4xl mx-auto bg-white shadow-lg print:shadow-none print:border-0">
        <CardContent className="p-8">
          {/* Header */}
          <div className="relative mb-8">
            <div className="absolute top-0 right-0 w-full h-16 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-500 rounded-t-lg"></div>
            <div className="relative pt-6 pb-4">
              <h1 className="text-white text-2xl font-bold text-center relative z-10">
                PRESCRIPTION
              </h1>
            </div>
          </div>

          {/* JeevanCare Logo and Title */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="currentColor">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.1 3.89 23 5 23H19C20.1 23 21 22.1 21 21V11L15 5V9H21ZM19 11H17L17 13H19V11ZM19 15H17V17H19V15ZM15 11H13V13H15V11ZM15 15H13V17H15V15ZM11 11H9V13H11V11ZM11 15H9V17H11V15ZM7 11H5V13H7V11ZM7 15H5V17H7V15Z"/>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-blue-600">Jeevancare</h2>
            </div>
          </div>

          {/* Patient Information */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <label className="text-sm font-medium text-gray-600">Patient Name</label>
                <p className="text-lg font-semibold text-gray-800">{patientName}</p>
              </div>
              <div className="border-b border-gray-200 pb-2">
                <label className="text-sm font-medium text-gray-600">Age</label>
                <p className="text-lg font-semibold text-gray-800">{age}</p>
              </div>
              <div className="border-b border-gray-200 pb-2">
                <label className="text-sm font-medium text-gray-600">Date</label>
                <p className="text-lg font-semibold text-gray-800">{date}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <label className="text-sm font-medium text-gray-600">Blood Group</label>
                <p className="text-lg font-semibold text-gray-800">{bloodGroup}</p>
              </div>
              <div className="border-b border-gray-200 pb-2">
                <label className="text-sm font-medium text-gray-600">Gender</label>
                <p className="text-lg font-semibold text-gray-800">{gender}</p>
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Symptoms</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{symptoms}</p>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Diagnosis</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-700">{diagnosis}</p>
            </div>
          </div>

          {/* Medicines */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Prescribed Medicines</h3>
            <div className="space-y-4">
              {medicines.map((medicine, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-800">{medicine.name}</h4>
                      <p className="text-sm text-gray-600">Dosage: {medicine.dosage}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Frequency: {medicine.frequency}</p>
                      <p className="text-sm text-gray-600">Duration: {medicine.duration}</p>
                    </div>
                  </div>
                  {medicine.instructions && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Instructions:</span> {medicine.instructions}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* JeevanCare Watermark */}
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 opacity-10">
              <svg viewBox="0 0 100 100" className="w-full h-full text-blue-500" fill="currentColor">
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M30 40 L45 55 L70 30" stroke="currentColor" strokeWidth="3" fill="none"/>
                <text x="50" y="75" textAnchor="middle" fontSize="8" fill="currentColor">JeevanCare</text>
              </svg>
            </div>
          </div>

          {/* Footer */}
          <div className="relative">
            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-500 rounded-b-lg"></div>
            <div className="relative p-4 flex justify-between items-center text-white">
              <div className="w-12 h-12 border-2 border-white rounded">
                {/* QR Code placeholder */}
                <div className="w-full h-full bg-white bg-opacity-20 rounded flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-1">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="w-1 h-1 bg-white rounded-sm"></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">www.jeevancare.com</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalPrescription;