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
    <div className="space-y-4">
      {/* Prescription Content */}
      <div id="prescription-content" className="bg-white p-8 rounded-lg border">
        {/* Header */}
        <div className="text-center border-b-2 border-blue-600 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-blue-600">JeevanCare AI Clinic</h1>
          <p className="text-gray-600">Digital Healthcare Solutions</p>
          <p className="text-sm text-gray-500">Prescription ID: {prescription.id}</p>
        </div>

        {/* Patient Information */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p><strong>Patient Name:</strong> {prescription.patientName}</p>
            <p><strong>Age:</strong> {prescription.age} years</p>
          </div>
          <div>
            <p><strong>Gender:</strong> {prescription.gender}</p>
            <p><strong>Blood Group:</strong> {prescription.bloodGroup}</p>
          </div>
          <div className="col-span-2">
            <p><strong>Date:</strong> {prescription.date}</p>
          </div>
        </div>

        {/* Symptoms */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Symptoms:</h3>
          <p className="text-gray-700 bg-gray-50 p-3 rounded">{prescription.symptoms}</p>
        </div>

        {/* Medications */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Prescribed Medications:</h3>
          {prescription.medications.map((medication, index) => (
            <div key={index} className="bg-blue-50 p-4 mb-3 rounded-lg border-l-4 border-blue-500">
              <div className="grid grid-cols-2 gap-2">
                <p><strong>Medicine:</strong> {medication.name}</p>
                <p><strong>Dosage:</strong> {medication.dosage}</p>
                <p><strong>Frequency:</strong> {medication.frequency}</p>
                <p><strong>Duration:</strong> {medication.duration}</p>
              </div>
              {medication.instructions && (
                <p className="mt-2"><strong>Instructions:</strong> {medication.instructions}</p>
              )}
            </div>
          ))}
        </div>

        {/* General Instructions */}
        {prescription.instructions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">General Instructions:</h3>
            <ul className="list-disc list-inside space-y-1">
              {prescription.instructions.map((instruction, index) => (
                <li key={index} className="text-gray-700">{instruction}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="text-center border-t pt-4 mt-8">
          <p><strong>Doctor:</strong> {prescription.doctorName}</p>
          <p className="text-sm text-gray-600">{prescription.clinicName}</p>
          <p className="text-xs text-gray-500 mt-2">Digital Signature: {prescription.signature}</p>
          <p className="text-xs text-gray-400 mt-2">
            This is a digitally generated prescription. Please consult your doctor for any clarifications.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button 
          onClick={generatePDF}
          disabled={isGenerating}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isGenerating ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Download PDF
        </Button>

        <Button onClick={printPrescription} variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>

        <Button onClick={sharePrescription} variant="outline">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>

        {onClose && (
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        )}
      </div>

      {/* QR Code for Verification (Optional) */}
      <div className="text-center mt-4">
        <p className="text-xs text-gray-500">
          Prescription can be verified at participating pharmacies using ID: {prescription.id}
        </p>
      </div>
    </div>
  );
}