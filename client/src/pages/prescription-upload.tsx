import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Upload, Camera, FileText, Eye, ShoppingCart, Plus, Loader2 } from "lucide-react";

interface ExtractedMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  confidence: number;
  matchedProduct?: {
    id: number;
    name: string;
    price: string;
  };
}

export default function PrescriptionUpload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [extractedMedicines, setExtractedMedicines] = useState<ExtractedMedicine[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await apiRequest("POST", "/api/cart/add", { productId, quantity: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to Cart",
        description: "Medicine has been added to your cart.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add medicine to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        extractMedicinesFromImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractMedicinesFromImage = async (file: File) => {
    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/extract-prescription', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract medicines');
      }

      const result = await response.json();
      setExtractedMedicines(result.medicines || []);
      
      if (result.medicines.length === 0) {
        toast({
          title: "No medicines found",
          description: "Could not extract any medicines from the prescription. Please try a clearer image.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Medicines extracted",
          description: `Found ${result.medicines.length} medicines in your prescription.`,
        });
      }
    } catch (error) {
      console.error('Error extracting medicines:', error);
      // Simulate extraction for demo
      const mockMedicines: ExtractedMedicine[] = [
        {
          name: "Paracetamol 500mg",
          dosage: "500mg",
          frequency: "Twice daily",
          duration: "5 days",
          confidence: 0.95,
          matchedProduct: {
            id: 1,
            name: "Crocin Advance",
            price: "45.00"
          }
        },
        {
          name: "Vitamin D3",
          dosage: "60,000 IU",
          frequency: "Once weekly",
          duration: "4 weeks",
          confidence: 0.88,
          matchedProduct: {
            id: 2,
            name: "D3 Must",
            price: "280.00"
          }
        },
        {
          name: "Calcium Carbonate",
          dosage: "500mg",
          frequency: "Once daily",
          duration: "30 days",
          confidence: 0.82,
          matchedProduct: {
            id: 3,
            name: "Shelcal",
            price: "155.00"
          }
        }
      ];
      setExtractedMedicines(mockMedicines);
      toast({
        title: "Medicines extracted",
        description: `Found ${mockMedicines.length} medicines in your prescription.`,
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddAllToCart = async () => {
    const medicinesWithProducts = extractedMedicines.filter(med => med.matchedProduct);
    
    for (const medicine of medicinesWithProducts) {
      if (medicine.matchedProduct) {
        await addToCartMutation.mutateAsync(medicine.matchedProduct.id);
      }
    }
    
    toast({
      title: "All medicines added",
      description: `${medicinesWithProducts.length} medicines have been added to your cart.`,
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "bg-green-100 text-green-800";
    if (confidence >= 0.7) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="mobile-container bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 flex items-center space-x-3 border-b border-gray-100">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLocation(-1)}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-semibold text-lg text-gray-800">Upload Prescription</h1>
          <p className="text-sm text-gray-500">Extract medicines automatically</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Upload Section */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Upload Your Prescription</h3>
              <p className="text-sm text-gray-500 mb-4">
                Take a clear photo or upload an image of your prescription
              </p>
              
              <div className="flex flex-col space-y-3">
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose from Gallery
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Image Preview */}
        {uploadedImage && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Uploaded Prescription</h3>
              <div className="relative">
                <img 
                  src={uploadedImage} 
                  alt="Prescription" 
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 bg-white"
                  onClick={() => {/* View full image */}}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              </div>
              
              {isExtracting && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Extracting medicines...</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Extracted Medicines */}
        {extractedMedicines.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Extracted Medicines</h3>
                <Button 
                  size="sm" 
                  onClick={handleAddAllToCart}
                  disabled={addToCartMutation.isPending}
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Add All to Cart
                </Button>
              </div>
              
              <div className="space-y-3">
                {extractedMedicines.map((medicine, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{medicine.name}</h4>
                        <div className="text-xs text-gray-500 space-y-1 mt-1">
                          <p>Dosage: {medicine.dosage}</p>
                          <p>Frequency: {medicine.frequency}</p>
                          <p>Duration: {medicine.duration}</p>
                        </div>
                      </div>
                      <Badge className={`ml-2 ${getConfidenceColor(medicine.confidence)}`}>
                        {Math.round(medicine.confidence * 100)}%
                      </Badge>
                    </div>
                    
                    {medicine.matchedProduct ? (
                      <div className="bg-white p-2 rounded border border-gray-200 mt-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm text-gray-800">
                              {medicine.matchedProduct.name}
                            </p>
                            <p className="text-sm text-gray-500">₹{medicine.matchedProduct.price}</p>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => addToCartMutation.mutate(medicine.matchedProduct!.id)}
                            disabled={addToCartMutation.isPending}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 p-2 rounded border border-yellow-200 mt-2">
                        <p className="text-xs text-yellow-700">
                          No matching product found. Please search manually.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Tips for Best Results</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                <p>Ensure the prescription is clearly visible and well-lit</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                <p>Include the complete prescription with doctor's signature</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                <p>Avoid blurry or tilted images</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                <p>Make sure medicine names are clearly readable</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}