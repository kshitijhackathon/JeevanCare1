import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, CreditCard, MapPin, User, Phone } from "lucide-react";
import type { CartItemWithProduct } from "@/lib/types";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ total }: { total: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  const handleAddressChange = (field: string, value: string) => {
    setDeliveryAddress(prev => ({ ...prev, [field]: value }));
  };

  const isAddressComplete = () => {
    return deliveryAddress.fullName && deliveryAddress.phone && 
           deliveryAddress.address && deliveryAddress.city && 
           deliveryAddress.state && deliveryAddress.pincode;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAddressComplete()) {
      toast({
        title: "Incomplete Address",
        description: "Please fill in all required delivery address fields",
        variant: "destructive",
      });
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
        shipping: {
          name: deliveryAddress.fullName,
          phone: deliveryAddress.phone,
          address: {
            line1: deliveryAddress.address,
            city: deliveryAddress.city,
            state: deliveryAddress.state,
            postal_code: deliveryAddress.pincode,
            country: 'IN',
          },
        },
      },
      redirect: 'if_required',
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Clear cart after successful payment
      await apiRequest("DELETE", "/api/cart/clear");
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      
      toast({
        title: "Payment Successful",
        description: "Your order has been placed successfully!",
      });
      
      // Navigate to delivery tracking
      setLocation("/delivery-tracking");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Delivery Address Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Delivery Address</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={deliveryAddress.fullName}
                  onChange={(e) => handleAddressChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={deliveryAddress.phone}
                  onChange={(e) => handleAddressChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                  className="mt-1"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">Address *</Label>
              <Textarea
                id="address"
                value={deliveryAddress.address}
                onChange={(e) => handleAddressChange('address', e.target.value)}
                placeholder="Enter your complete address"
                className="mt-1"
                rows={3}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city" className="text-sm font-medium text-gray-700">City *</Label>
                <Input
                  id="city"
                  type="text"
                  value={deliveryAddress.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  placeholder="Enter city"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="state" className="text-sm font-medium text-gray-700">State *</Label>
                <Input
                  id="state"
                  type="text"
                  value={deliveryAddress.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  placeholder="Enter state"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="pincode" className="text-sm font-medium text-gray-700">Pincode *</Label>
                <Input
                  id="pincode"
                  type="text"
                  value={deliveryAddress.pincode}
                  onChange={(e) => handleAddressChange('pincode', e.target.value)}
                  placeholder="Enter pincode"
                  className="mt-1"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="landmark" className="text-sm font-medium text-gray-700">Landmark (Optional)</Label>
              <Input
                id="landmark"
                type="text"
                value={deliveryAddress.landmark}
                onChange={(e) => handleAddressChange('landmark', e.target.value)}
                placeholder="Enter nearby landmark"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-lg text-gray-800">Payment Details</h3>
          </div>
          <PaymentElement 
            options={{
              layout: "tabs"
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-800">Total Amount</span>
            <span className="text-2xl font-bold text-gray-800">₹{total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={!stripe || isProcessing || !isAddressComplete()}
        className="btn-primary w-full text-lg py-4"
      >
        {isProcessing ? "Processing..." : `Pay ₹${total.toFixed(2)}`}
      </Button>
    </form>
  );
};

const PaymentSuccessModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Payment Success</h3>
        <p className="text-gray-600 text-sm mb-6">
          Your payment has been successful. Your order will be processed and delivered soon.
        </p>
        
        <Button 
          onClick={onClose}
          className="btn-primary w-full"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: cartItems, isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
  });

  const subtotal = cartItems?.reduce((total, item) => {
    return total + (parseFloat(item.product.price) * item.quantity);
  }, 0) || 0;

  const taxes = subtotal * 0.1; // 10% tax
  const total = subtotal + taxes;

  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      // Create PaymentIntent as soon as the page loads
      apiRequest("POST", "/api/create-payment-intent", { amount: total })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch((error) => {
          console.error("Error creating payment intent:", error);
        });
    }
  }, [total, cartItems]);

  // Check URL for payment success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_intent_client_secret')) {
      setShowSuccess(true);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="mobile-container">
        <header className="sticky top-0 bg-white shadow-sm border-b border-gray-100 px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/cart")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="font-semibold text-lg text-gray-800">Checkout</h2>
            <div></div>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No items to checkout</h3>
            <p className="text-gray-600 mb-6">Add some medicines to your cart first</p>
            <Button onClick={() => setLocation("/pharmacy")} className="btn-primary">
              Browse Pharmacy
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <header className="sticky top-0 bg-white shadow-sm border-b border-gray-100 px-4 py-4 z-10">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/cart")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-semibold text-lg text-gray-800">Checkout</h2>
          <div></div>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4">
        {/* Order Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={item.product.imageUrl || "https://images.unsplash.com/photo-1584362917165-526a968579e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"}
                      alt={item.product.name}
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{item.product.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-medium text-gray-800">
                    ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-800">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taxes</span>
                <span className="text-gray-800">${taxes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-gray-800">Total</span>
                <span className="text-gray-800">${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm total={total} />
        </Elements>
      </div>

      <PaymentSuccessModal 
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          setLocation("/");
        }}
      />
    </div>
  );
}
