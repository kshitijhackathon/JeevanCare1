import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Share2, Printer, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PrescriptionData {
  id: string;
  patientName: string;
  age: string;
  gender: string;
  bloodGroup: string;
  date: string;
  symptoms: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  instructions: string[];
  doctorName: string;
  clinicName: string;
  signature: string;
}

interface EnhancedPrescriptionDownloadProps {
  prescription: PrescriptionData;
  onClose?: () => void;
}

export default function EnhancedPrescriptionDownload({ 
  prescription, 
  onClose 
}: EnhancedPrescriptionDownloadProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate PDF using html2canvas and jsPDF
  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Dynamically import the libraries to reduce bundle size
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const element = document.getElementById('prescription-content');
      if (!element) {
        throw new Error('Prescription content not found');
      }

      // Configure html2canvas for better quality
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculate dimensions to fit A4
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      pdf.save(`prescription-${prescription.id}.pdf`);
      
      toast({
        title: "Prescription Downloaded",
        description: "PDF has been saved to your downloads folder",
      });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Download Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Share prescription
  const sharePrescription = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Medical Prescription',
          text: `Prescription for ${prescription.patientName}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      const prescriptionText = `
Medical Prescription
Patient: ${prescription.patientName}
Date: ${prescription.date}
Symptoms: ${prescription.symptoms}
Medications: ${prescription.medications.map(m => `${m.name} - ${m.dosage}`).join(', ')}
Doctor: ${prescription.doctorName}
      `.trim();
      
      navigator.clipboard.writeText(prescriptionText);
      toast({
        title: "Copied to Clipboard",
        description: "Prescription details copied for sharing",
      });
    }
  };

  // Print prescription
  const printPrescription = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const prescriptionHTML = document.getElementById('prescription-content')?.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medical Prescription</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .prescription { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
            .patient-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
            .medications { margin: 20px 0; }
            .medication-item { background: #f5f5f5; padding: 10px; margin: 5px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="prescription">
            ${prescriptionHTML}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Medical Prescription</h2>
          {onClose && (
            <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
              ✕
            </Button>
          )}
        </div>
        
        {/* Prescription Content */}
        <div id="prescription-content" className="bg-gradient-to-br from-blue-50 to-white p-8">
          {/* Header */}
          <div className="text-center border-b-4 border-gradient-to-r from-blue-600 to-purple-600 pb-6 mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg mb-4">
              <h1 className="text-3xl font-bold">🏥 JeevanCare AI Clinic</h1>
              <p className="text-blue-100">Advanced Digital Healthcare Solutions</p>
            </div>
            <p className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">
              📋 Prescription ID: {prescription.id}
            </p>
          </div>

          {/* Patient Information Card */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl mb-8 border-l-4 border-green-500">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              👤 Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded">Name:</span>
                  <span className="font-semibold text-gray-800">{prescription.patientName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded">Age:</span>
                  <span className="font-semibold text-gray-800">{prescription.age} years</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded">Gender:</span>
                  <span className="font-semibold text-gray-800">{prescription.gender}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded">Blood:</span>
                  <span className="font-semibold text-red-600">{prescription.bloodGroup}</span>
                </div>
              </div>
              <div className="col-span-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded">📅 Date:</span>
                  <span className="font-semibold text-gray-800">{prescription.date}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Symptoms Card */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl mb-8 border-l-4 border-yellow-500">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              🩺 Symptoms Diagnosed
            </h3>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <p className="text-gray-700 leading-relaxed">{prescription.symptoms}</p>
            </div>
          </div>

          {/* Medications Card */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl mb-8 border-l-4 border-purple-500">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              💊 Prescribed Medications
            </h3>
            <div className="space-y-4">
              {prescription.medications.map((medication, index) => (
                <div key={index} className="bg-white p-5 rounded-lg border-2 border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-purple-700">{medication.name}</h4>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                      Medicine {index + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">💊 Dosage:</span>
                      <span className="font-semibold text-gray-800">{medication.dosage}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">⏰ Frequency:</span>
                      <span className="font-semibold text-gray-800">{medication.frequency}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">📅 Duration:</span>
                      <span className="font-semibold text-gray-800">{medication.duration}</span>
                    </div>
                  </div>
                  {medication.instructions && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <p className="text-sm"><strong>⚠️ Special Instructions:</strong> {medication.instructions}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* General Instructions Card */}
          {prescription.instructions.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl mb-8 border-l-4 border-red-500">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                📝 General Instructions
              </h3>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <ul className="space-y-3">
                  {prescription.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 leading-relaxed">{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Doctor Information Footer */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border-2 border-gray-200">
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <h4 className="text-lg font-bold text-gray-800 mb-2">👨‍⚕️ Consulting Doctor</h4>
                <p className="text-xl font-bold text-blue-600">{prescription.doctorName}</p>
                <p className="text-gray-600 font-medium">{prescription.clinicName}</p>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>🔏 Digital Signature: {prescription.signature}</p>
                <p className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg">
                  ⚠️ This is a digitally generated prescription. Please consult your doctor for any clarifications.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 p-6 rounded-lg flex flex-wrap gap-3 justify-center">
          <Button 
            onClick={generatePDF}
            disabled={isGenerating}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3"
          >
            {isGenerating ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download PDF
          </Button>

          <Button onClick={printPrescription} variant="outline" className="px-6 py-3">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>

          <Button onClick={sharePrescription} variant="outline" className="px-6 py-3">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>

          {onClose && (
            <Button onClick={onClose} variant="secondary" className="px-6 py-3">
              Close
            </Button>
          )}
        </div>

        {/* QR Code for Verification (Optional) */}
        <div className="text-center mt-4 p-4">
          <p className="text-xs text-gray-500 bg-yellow-50 px-3 py-2 rounded-lg">
            📱 Prescription can be verified at participating pharmacies using ID: {prescription.id}
          </p>
        </div>
      </div>
    </div>
  );
}