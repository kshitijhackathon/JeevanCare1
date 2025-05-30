import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  ShoppingCart,
  Plus,
  Minus,
  Truck,
  Clock,
  Shield,
  Pill,
  Heart,
  Baby,
  Leaf,
  Stethoscope,
  Thermometer,
  Upload,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Medicine {
  id: number;
  name: string;
  genericName: string;
  manufacturer: string;
  price: number;
  mrp: number;
  discount: number;
  dosage: string;
  composition: string;
  category: string;
  prescriptionRequired: boolean;
  inStock: boolean;
  quantity: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  description: string;
}

export default function Pharmacy() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartItems, setCartItems] = useState<{[key: number]: number}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch medicines
  const { data: medicines, isLoading } = useQuery<Medicine[]>({
    queryKey: ['/api/medicines', selectedCategory],
    queryFn: async () => {
      const response = await fetch(`/api/medicines?category=${selectedCategory}`);
      if (!response.ok) throw new Error('Failed to fetch medicines');
      return response.json();
    }
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ medicineId, quantity }: { medicineId: number; quantity: number }) => {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: medicineId, quantity })
      });
      if (!response.ok) throw new Error('Failed to add to cart');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to Cart",
        description: "Medicine added to your cart successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    }
  });

  const categories = [
    { id: 'all', name: 'All Categories', icon: Pill, color: 'bg-blue-100 text-blue-600' },
    { id: 'prescription', name: 'Prescription', icon: Stethoscope, color: 'bg-red-100 text-red-600' },
    { id: 'otc', name: 'Over-the-Counter', icon: Pill, color: 'bg-green-100 text-green-600' },
    { id: 'vitamins', name: 'Vitamins & Supplements', icon: Leaf, color: 'bg-orange-100 text-orange-600' },
    { id: 'baby_care', name: 'Baby Care', icon: Baby, color: 'bg-pink-100 text-pink-600' },
    { id: 'personal_care', name: 'Personal Care', icon: Heart, color: 'bg-purple-100 text-purple-600' },
    { id: 'medical_devices', name: 'Medical Devices', icon: Thermometer, color: 'bg-gray-100 text-gray-600' }
  ];

  const filteredMedicines = medicines?.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         medicine.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         medicine.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  const updateCartQuantity = (medicineId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      const { [medicineId]: removed, ...rest } = cartItems;
      setCartItems(rest);
    } else {
      setCartItems(prev => ({ ...prev, [medicineId]: newQuantity }));
      // Add to cart via API
      addToCartMutation.mutate({ medicineId, quantity: newQuantity });
    }
  };

  const getTotalCartItems = () => {
    return Object.values(cartItems).reduce((sum, quantity) => sum + quantity, 0);
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
      {/* Jeevan Care Pharmacy Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold">Jeevan Care Pharmacy</h1>
            <p className="text-sm text-blue-100">Your Health, Our Priority</p>
          </div>
          
          <Link href="/cart" className="relative">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ShoppingCart className="w-5 h-5" />
              {getTotalCartItems() > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getTotalCartItems()}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search medicines, brands, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-0 rounded-lg shadow-sm"
          />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Prescription Upload Banner */}
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">Upload Prescription</h3>
                <p className="text-sm text-green-600">Get medicines delivered to your doorstep</p>
              </div>
              <Button className="bg-green-500 hover:bg-green-600 text-white">
                Upload
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Service Features */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <CardContent className="p-3">
              <Truck className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-xs font-medium">Free Delivery</p>
              <p className="text-xs text-gray-500">Above ₹299</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3">
              <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-xs font-medium">Express Delivery</p>
              <p className="text-xs text-gray-500">Under 2 hours</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3">
              <Shield className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-xs font-medium">100% Authentic</p>
              <p className="text-xs text-gray-500">Verified medicines</p>
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shop by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedCategory === category.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.color}`}>
                      <category.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{category.name}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Featured Medicines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Featured Medicines</span>
              <Badge variant="outline">{filteredMedicines.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMedicines.length > 0 ? (
              <div className="space-y-4">
                {filteredMedicines.map((medicine) => (
                  <Card key={medicine.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex space-x-3">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Pill className="w-8 h-8 text-gray-400" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-sm">{medicine.name}</h3>
                              <p className="text-xs text-gray-600">{medicine.manufacturer}</p>
                              <p className="text-xs text-gray-500">{medicine.dosage}</p>
                            </div>
                            {medicine.prescriptionRequired && (
                              <Badge className="bg-red-100 text-red-600 text-xs">
                                Rx Required
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-600">{medicine.rating}</span>
                              <span className="text-xs text-gray-400">({medicine.reviewCount})</span>
                            </div>
                            {medicine.inStock ? (
                              <Badge className="bg-green-100 text-green-600 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                In Stock
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-600 text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Out of Stock
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-green-600">₹{medicine.price}</span>
                              {medicine.discount > 0 && (
                                <>
                                  <span className="text-xs text-gray-400 line-through">₹{medicine.mrp}</span>
                                  <Badge className="bg-orange-100 text-orange-600 text-xs">
                                    {medicine.discount}% off
                                  </Badge>
                                </>
                              )}
                            </div>
                            
                            {medicine.inStock && (
                              <div className="flex items-center space-x-2">
                                {cartItems[medicine.id] ? (
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateCartQuantity(medicine.id, cartItems[medicine.id] - 1)}
                                      className="w-8 h-8 p-0"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">{cartItems[medicine.id]}</span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateCartQuantity(medicine.id, cartItems[medicine.id] + 1)}
                                      className="w-8 h-8 p-0"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      updateCartQuantity(medicine.id, 1);
                                      addToCartMutation.mutate({ medicineId: medicine.id, quantity: 1 });
                                    }}
                                    disabled={addToCartMutation.isPending}
                                    className="bg-blue-500 hover:bg-blue-600 text-white"
                                  >
                                    Add to Cart
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Pill className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No medicines found</p>
                <p className="text-sm text-gray-400">
                  {searchQuery 
                    ? `No results for "${searchQuery}"`
                    : `No medicines available in ${selectedCategory} category`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
