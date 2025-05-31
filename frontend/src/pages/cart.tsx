import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Minus, Plus, Trash2, CreditCard } from "lucide-react";
import type { CartItemWithProduct } from "@/lib/types";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: cartItems, isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      return await apiRequest("PUT", `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
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

  const subtotal = cartItems?.reduce((total, item) => {
    return total + (parseFloat(item.product.price) * item.quantity);
  }, 0) || 0;

  const taxes = subtotal * 0.1; // 10% tax
  const total = subtotal + taxes;

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="mobile-container">
        <header className="sticky top-0 bg-white shadow-sm border-b border-gray-100 px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/pharmacy")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="font-semibold text-lg text-gray-800">My Cart</h2>
            <div></div>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">Add some medicines to get started</p>
            <Button onClick={() => setLocation("/pharmacy")} className="btn-primary">
              Browse Pharmacy
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <header className="sticky top-0 bg-white shadow-sm border-b border-gray-100 px-4 py-4 z-10">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/pharmacy")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-semibold text-lg text-gray-800">My Cart</h2>
          <div></div>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4">
        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {cartItems.map((item) => (
            <Card key={item.id} className="shadow-sm border border-gray-100">
              <CardContent className="p-4 flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-xs">
                    {item.product.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{item.product.name}</h4>
                  <p className="text-sm text-gray-500">{item.product.category}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantityMutation.mutate({ 
                        id: item.id, 
                        quantity: Math.max(1, item.quantity - 1) 
                      })}
                      disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-medium min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantityMutation.mutate({ 
                        id: item.id, 
                        quantity: item.quantity + 1 
                      })}
                      disabled={updateQuantityMutation.isPending}
                      className="bg-primary text-white border-primary hover:bg-primary/90"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">
                    ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeItemMutation.mutate(item.id)}
                    disabled={removeItemMutation.isPending}
                    className="text-red-500 hover:text-red-700 mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Payment Details */}
        <Card className="bg-gray-50 mb-6">
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-800 mb-3">Payment Detail</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-800">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxes</span>
                <span className="text-gray-800">${taxes.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-800">Total</span>
                  <span className="text-gray-800">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Payment Method */}
            <div className="mt-4">
              <h5 className="font-medium text-gray-800 mb-2">Payment Method</h5>
              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg bg-white">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-700">Credit Card</span>
                <Button variant="ghost" size="sm" className="text-secondary ml-auto">
                  Change
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Total Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-800">Total</span>
              <span className="text-2xl font-bold text-gray-800">${total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Fixed Bottom Action */}
      <div className="p-4 bg-white border-t border-gray-100">
        <Button 
          onClick={() => setLocation("/checkout")}
          className="btn-primary w-full text-lg py-4"
        >
          Checkout
        </Button>
      </div>
    </div>
  );
}
