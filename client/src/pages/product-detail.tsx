import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Heart, Minus, Plus, Star } from "lucide-react";
import type { Product } from "@shared/schema";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const [, navigate] = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();

  const productId = params?.id ? parseInt(params.id) : 0;

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });

  const addToCartMutation = useMutation({
    mutationFn: async (data: { productId: number; quantity: number }) => {
      return await apiRequest("POST", "/api/cart", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to Cart",
        description: `${product?.name} has been added to your cart.`,
      });
      navigate("/cart");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Product Not Found</h2>
          <Button onClick={() => navigate("/pharmacy")}>
            Back to Pharmacy
          </Button>
        </div>
      </div>
    );
  }

  const rating = parseFloat(product.rating || "0");

  const handleAddToCart = () => {
    addToCartMutation.mutate({
      productId: product.id,
      quantity,
    });
  };

  return (
    <div className="mobile-container">
      <header className="sticky top-0 bg-white shadow-sm border-b border-gray-100 px-4 py-4 z-10">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/pharmacy")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-semibold text-lg text-gray-800">{product.name}</h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsFavorite(!isFavorite)}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </Button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Product Image */}
          <div className="text-center mb-6">
            <img 
              src={product.imageUrl || "https://images.unsplash.com/photo-1584362917165-526a968579e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"}
              alt={product.name}
              className="w-32 h-32 mx-auto object-cover rounded-xl shadow-lg"
            />
            {product.isOnSale && (
              <Badge className="mt-2 bg-red-500 text-white">
                On Sale
              </Badge>
            )}
          </div>
          
          {/* Product Info */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h3>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-gray-600">{rating.toFixed(1)}</span>
            </div>
            
            {/* Quantity Selector */}
            <div className="flex items-center space-x-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-xl font-semibold text-gray-800 min-w-[2rem] text-center">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
                className="bg-primary text-white border-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <div className="ml-auto">
                <span className="text-2xl font-bold text-gray-800">
                  ${(parseFloat(product.price) * quantity).toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* Description */}
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Description</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                {product.description || `${product.name} is a high-quality pharmaceutical product designed to provide effective treatment. Always consult with a healthcare professional before use and follow the recommended dosage instructions.`}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fixed Bottom Action */}
      <div className="p-4 bg-white border-t border-gray-100">
        <Button 
          onClick={handleAddToCart}
          disabled={addToCartMutation.isPending || !product.inStock}
          className="btn-primary w-full text-lg py-4"
        >
          {addToCartMutation.isPending ? "Adding..." : !product.inStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}
