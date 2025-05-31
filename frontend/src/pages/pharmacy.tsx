import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
  AlertCircle,
  SlidersHorizontal,
  X,
  ArrowUpDown
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
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartItems, setCartItems] = useState<{[key: number]: number}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Advanced filter states
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [minRating, setMinRating] = useState(0);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [showPrescriptionOnly, setShowPrescriptionOnly] = useState(false);
  const [showDiscountedOnly, setShowDiscountedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  // Get unique manufacturers for filter
  const uniqueManufacturers = Array.from(new Set(medicines?.map(m => m.manufacturer) || []));

  // Advanced filtering logic
  const filteredMedicines = medicines?.filter(medicine => {
    // Search filter
    const matchesSearch = medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         medicine.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         medicine.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         medicine.composition.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Price range filter
    const withinPriceRange = medicine.price >= priceRange[0] && medicine.price <= priceRange[1];
    
    // Rating filter
    const meetsRating = medicine.rating >= minRating;
    
    // Stock filter
    const stockFilter = !showInStockOnly || medicine.inStock;
    
    // Prescription filter
    const prescriptionFilter = !showPrescriptionOnly || medicine.prescriptionRequired;
    
    // Discount filter
    const discountFilter = !showDiscountedOnly || medicine.discount > 0;
    
    // Manufacturer filter
    const manufacturerFilter = selectedManufacturers.length === 0 || selectedManufacturers.includes(medicine.manufacturer);

    return matchesSearch && withinPriceRange && meetsRating && stockFilter && prescriptionFilter && discountFilter && manufacturerFilter;
  }) || [];

  // Sorting logic
  const sortedMedicines = [...filteredMedicines].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'discount':
        return b.discount - a.discount;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'newest':
        return b.id - a.id;
      default:
        return 0;
    }
  });

  const clearAllFilters = () => {
    setPriceRange([0, 2000]);
    setMinRating(0);
    setShowInStockOnly(false);
    setShowPrescriptionOnly(false);
    setShowDiscountedOnly(false);
    setSortBy("relevance");
    setSelectedManufacturers([]);
    setSelectedCategory("all");
    setSearchQuery("");
  };

  const activeFiltersCount = [
    priceRange[0] > 0 || priceRange[1] < 2000,
    minRating > 0,
    showInStockOnly,
    showPrescriptionOnly,
    showDiscountedOnly,
    selectedManufacturers.length > 0,
    selectedCategory !== "all",
    searchQuery.length > 0
  ].filter(Boolean).length;

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
            onClick={() => setLocation("/")}
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
        <div className="space-y-3">
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
          
          {/* Filter and Sort Bar */}
          <div className="flex items-center space-x-2">
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filter
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 bg-blue-500 text-white text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center justify-between">
                    <span>Filters</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearAllFilters}
                      disabled={activeFiltersCount === 0}
                    >
                      Clear All
                    </Button>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="space-y-6 mt-6">
                  {/* Price Range */}
                  <div>
                    <h4 className="font-medium mb-3">Price Range</h4>
                    <div className="px-2">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={2000}
                        step={10}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>₹{priceRange[0]}</span>
                        <span>₹{priceRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <h4 className="font-medium mb-3">Minimum Rating</h4>
                    <div className="flex items-center space-x-2">
                      {[0, 1, 2, 3, 4].map((rating) => (
                        <Button
                          key={rating}
                          variant={minRating === rating ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMinRating(rating)}
                          className="flex items-center space-x-1"
                        >
                          <Star className="w-3 h-3" />
                          <span>{rating}+</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Filters */}
                  <div>
                    <h4 className="font-medium mb-3">Quick Filters</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="instock"
                          checked={showInStockOnly}
                          onCheckedChange={(checked) => setShowInStockOnly(checked === true)}
                        />
                        <label htmlFor="instock" className="text-sm">In Stock Only</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="prescription"
                          checked={showPrescriptionOnly}
                          onCheckedChange={(checked) => setShowPrescriptionOnly(checked === true)}
                        />
                        <label htmlFor="prescription" className="text-sm">Prescription Required</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="discounted"
                          checked={showDiscountedOnly}
                          onCheckedChange={(checked) => setShowDiscountedOnly(checked === true)}
                        />
                        <label htmlFor="discounted" className="text-sm">On Sale/Discounted</label>
                      </div>
                    </div>
                  </div>

                  {/* Manufacturer Filter */}
                  <div>
                    <h4 className="font-medium mb-3">Manufacturer</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {uniqueManufacturers.map((manufacturer) => (
                        <div key={manufacturer} className="flex items-center space-x-2">
                          <Checkbox
                            id={manufacturer}
                            checked={selectedManufacturers.includes(manufacturer)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedManufacturers([...selectedManufacturers, manufacturer]);
                              } else {
                                setSelectedManufacturers(selectedManufacturers.filter(m => m !== manufacturer));
                              }
                            }}
                          />
                          <label htmlFor={manufacturer} className="text-sm">{manufacturer}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 bg-white border-gray-200">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="discount">Best Discount</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-blue-600 hover:text-blue-700"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
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
              <Link href="/prescription-upload">
                <Button className="bg-green-500 hover:bg-green-600 text-white">
                  Upload
                </Button>
              </Link>
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

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={showInStockOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowInStockOnly(!showInStockOnly)}
            className="text-xs"
          >
            In Stock
          </Button>
          <Button
            variant={showDiscountedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDiscountedOnly(!showDiscountedOnly)}
            className="text-xs"
          >
            On Sale
          </Button>
          <Button
            variant={minRating >= 4 ? "default" : "outline"}
            size="sm"
            onClick={() => setMinRating(minRating >= 4 ? 0 : 4)}
            className="text-xs"
          >
            4+ Rating
          </Button>
          <Button
            variant={priceRange[1] <= 500 ? "default" : "outline"}
            size="sm"
            onClick={() => setPriceRange(priceRange[1] <= 500 ? [0, 2000] : [0, 500])}
            className="text-xs"
          >
            Under ₹500
          </Button>
        </div>

        {/* Search Results Header */}
        {(searchQuery || activeFiltersCount > 0) && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">Search Results</h3>
                  <p className="text-sm text-gray-600">
                    {searchQuery && `"${searchQuery}" • `}
                    {sortedMedicines.length} medicine{sortedMedicines.length !== 1 ? 's' : ''} found
                    {activeFiltersCount > 0 && ` • ${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} applied`}
                  </p>
                </div>
                {(searchQuery || activeFiltersCount > 0) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      clearAllFilters();
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medicine List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{searchQuery || activeFiltersCount > 0 ? 'Results' : 'Featured Medicines'}</span>
              <Badge variant="outline">{sortedMedicines.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedMedicines.length > 0 ? (
              <div className="space-y-4">
                {sortedMedicines.map((medicine) => (
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
