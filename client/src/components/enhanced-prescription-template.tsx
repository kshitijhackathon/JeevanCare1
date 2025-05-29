import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Printer, Download, Stethoscope, Calendar, User, Heart } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface EnhancedPrescriptionTemplateProps {
  prescription: any;
  onClose?: () => void;
}

export default function EnhancedPrescriptionTemplate({ 
  prescription, 
  onClose 
}: EnhancedPrescriptionTemplateProps) {
  const prescriptionRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (prescriptionRef.current) {
      try {
        const canvas = await html2canvas(prescriptionRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // Split into multiple pages if content is too long
        if (pdfHeight > pdf.internal.pageSize.getHeight()) {
          const pageHeight = pdf.internal.pageSize.getHeight();
          let remainingHeight = pdfHeight;
          let yPosition = 0;
          
          while (remainingHeight > 0) {
            const currentPageHeight = Math.min(pageHeight, remainingHeight);
            
            pdf.addImage(
              canvas.toDataURL('image/png'), 
              'PNG', 
              0, 
              yPosition, 
              pdfWidth, 
              currentPageHeight
            );
            
            remainingHeight -= pageHeight;
            yPosition -= pageHeight;
            
            if (remainingHeight > 0) {
              pdf.addPage();
            }
          }
        } else {
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
        
        pdf.save(`prescription-${prescription.id}.pdf`);
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Unable to generate PDF. Please try printing instead.');
      }
    }
  };

  if (!prescription) {
    return (
      <div className="p-8 text-center">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No prescription data available</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white">
      {/* Action Buttons */}
      <div className="flex justify-between items-center p-4 bg-gray-50 border-b print:hidden">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Digital Prescription
        </h3>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownloadPDF} variant="default" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="ghost" size="sm">
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Prescription Content */}
      <div ref={prescriptionRef} className="p-8 bg-white min-h-[800px]">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-blue-200 pb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-800">{prescription.clinicName}</h1>
              <p className="text-sm text-gray-600">{prescription.clinicAddress}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-semibold">Dr. {prescription.doctorName}</span></p>
              <p className="text-gray-600">{prescription.doctorSpecialization}</p>
            </div>
            <div className="text-right">
              <p><span className="font-semibold">Emergency:</span> {prescription.emergencyContact}</p>
              <p className="text-gray-600">Available 24/7</p>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                <User className="h-4 w-4" />
                Patient Information
              </h3>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Name:</span>
                  <p className="text-gray-700">{prescription.patientName}</p>
                </div>
                <div>
                  <span className="font-medium">Age:</span>
                  <p className="text-gray-700">{prescription.age} years</p>
                </div>
                <div>
                  <span className="font-medium">Gender:</span>
                  <p className="text-gray-700">{prescription.gender}</p>
                </div>
                <div>
                  <span className="font-medium">Blood Group:</span>
                  <p className="text-gray-700">{prescription.bloodGroup}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                <Calendar className="h-4 w-4" />
                Prescription Details
              </h3>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Prescription ID:</span>
                <p className="text-gray-700 font-mono">{prescription.id}</p>
              </div>
              <div>
                <span className="font-medium">Date & Time:</span>
                <p className="text-gray-700">{prescription.date} at {prescription.time}</p>
              </div>
              <div>
                <span className="font-medium">Valid for:</span>
                <p className="text-gray-700">{prescription.validityDays} days</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Diagnosis */}
        <Card className="mb-6 border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <h3 className="flex items-center gap-2 font-semibold text-gray-800">
              <Heart className="h-4 w-4" />
              Diagnosis & Symptoms
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Primary Diagnosis:</span>
                <p className="text-gray-700 text-lg font-semibold text-red-700">{prescription.diagnosis}</p>
              </div>
              <div>
                <span className="font-medium">Reported Symptoms:</span>
                <p className="text-gray-700">{prescription.symptoms}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medications */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="font-semibold text-gray-800 text-lg">℞ Prescribed Medications</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prescription.medications?.map((medication: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 text-lg">{medication.id}. {medication.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{medication.composition}</p>
                      <p className="text-xs text-gray-500">Manufacturer: {medication.manufacturer}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Dosage:</span>
                          <p className="text-blue-700 font-semibold">{medication.dosage}</p>
                        </div>
                        <div>
                          <span className="font-medium">Frequency:</span>
                          <p className="text-green-700 font-semibold">{medication.frequency}</p>
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span>
                          <p className="text-purple-700 font-semibold">{medication.duration}</p>
                        </div>
                        <div>
                          <span className="font-medium">Price:</span>
                          <p className="text-orange-700 font-semibold">{medication.price}</p>
                        </div>
                      </div>
                      <div className="mt-2 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                        <span className="font-medium text-sm">Instructions:</span>
                        <p className="text-xs text-gray-700">{medication.instructions}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {prescription.totalCost && (
              <div className="mt-4 p-3 bg-green-50 rounded border text-right">
                <span className="font-semibold text-green-800">Total Estimated Cost: {prescription.totalCost}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-800">📋 General Instructions</h3>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {prescription.instructions?.map((instruction: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="text-gray-700">{instruction}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-800">⚠️ Precautions</h3>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {prescription.precautions?.map((precaution: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span className="text-gray-700">{precaution}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Diet & Follow-up */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-800">🥗 Diet Recommendations</h3>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {prescription.dietRecommendations?.map((diet: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span className="text-gray-700">{diet}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-800">📅 Follow-up Instructions</h3>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {prescription.followUp?.map((followUp: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span className="text-gray-700">{followUp}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <Separator className="my-6" />
        <div className="text-center text-xs text-gray-500 space-y-2">
          <p className="font-semibold">{prescription.signature}</p>
          <p>This prescription is generated by AI and should be reviewed by a qualified medical professional.</p>
          <p>For any queries or emergencies, contact: {prescription.emergencyContact}</p>
          <p className="font-mono">Generated on: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}