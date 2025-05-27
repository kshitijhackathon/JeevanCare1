import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import Header from "@/components/header";
import ProductCard from "@/components/product-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, ShoppingCart, Upload } from "lucide-react";
import type { Product } from "@shared/schema";

export default function Pharmacy() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: cartItems } = useQuery({
    queryKey: ["/api/cart"],
  });

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const popularProducts = filteredProducts.filter(p => !p.isOnSale);
  const saleProducts = filteredProducts.filter(p => p.isOnSale);
  const cartItemCount = cartItems?.length || 0;

  if (isLoading) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="mobile-container">
      {/* Pharmacy Header */}
      <header className="sticky top-0 bg-white shadow-sm border-b border-gray-100 px-4 py-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-semibold text-lg text-gray-800">Pharmacy</h2>
          <Link href="/cart" className="relative">
            <Button variant="ghost" size="sm">
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
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
            placeholder="Search drugs, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl border-gray-200 focus:border-primary"
          />
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        {/* Prescription Upload */}
        <div className="p-4">
          <Card className="bg-primary/10 border border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Order quickly with</h3>
                  <p className="text-sm text-gray-600">Prescription</p>
                </div>
              </div>
              <Button className="btn-primary text-sm">
                Upload Prescription
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Popular Products */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-800">Popular Products</h3>
            <Button variant="ghost" size="sm" className="text-secondary">
              See all
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            {popularProducts.slice(0, 3).map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
          
          {/* Products on Sale */}
          {saleProducts.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-3">Products on Sale</h4>
              <div className="grid grid-cols-3 gap-4">
                {saleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} compact showSaleBadge />
                ))}
              </div>
            </div>
          )}
          
          {/* All Products */}
          {filteredProducts.length === 0 && searchQuery && (
            <div className="text-center py-8 text-gray-500">
              <p>No products found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
