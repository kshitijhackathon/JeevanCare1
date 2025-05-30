import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, Truck, Phone, CheckCircle } from "lucide-react";

interface DeliveryPerson {
  name: string;
  phone: string;
  photo: string;
  vehicleNumber: string;
  rating: number;
}

interface DeliveryStatus {
  id: string;
  status: 'confirmed' | 'preparing' | 'on_the_way' | 'delivered';
  estimatedTime: string;
  currentLocation: string;
  deliveryPerson: DeliveryPerson;
  orderDetails: {
    orderId: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    total: number;
    deliveryAddress: string;
  };
}

export default function DeliveryTracking() {
  const [, navigate] = useLocation();
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>({
    id: "DEL-2025-001",
    status: "on_the_way",
    estimatedTime: "15-20 minutes",
    currentLocation: "Near City Mall, 2.5 km away",
    deliveryPerson: {
      name: "Rajesh Kumar",
      phone: "+91 98765 43210",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      vehicleNumber: "DL 01 AB 1234",
      rating: 4.8
    },
    orderDetails: {
      orderId: "ORD-2025-001",
      items: [
        { name: "Paracetamol 500mg", quantity: 2, price: 45 },
        { name: "Vitamin D3 Tablets", quantity: 1, price: 280 }
      ],
      total: 325,
      deliveryAddress: "123, Sector 15, Noida, UP 201301"
    }
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'on_the_way': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Order Confirmed';
      case 'preparing': return 'Preparing';
      case 'on_the_way': return 'On the Way';
      case 'delivered': return 'Delivered';
      default: return 'Unknown';
    }
  };

  const getStatusSteps = () => [
    { key: 'confirmed', label: 'Confirmed', completed: true },
    { key: 'preparing', label: 'Preparing', completed: true },
    { key: 'on_the_way', label: 'On the Way', completed: deliveryStatus.status === 'on_the_way' || deliveryStatus.status === 'delivered' },
    { key: 'delivered', label: 'Delivered', completed: deliveryStatus.status === 'delivered' }
  ];

  return (
    <div className="mobile-container bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 flex items-center space-x-3 border-b border-gray-100">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-semibold text-lg text-gray-800">Track Delivery</h1>
          <p className="text-sm text-gray-500">Order #{deliveryStatus.orderDetails.orderId}</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Current Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Badge className={getStatusBadgeColor(deliveryStatus.status)}>
                {getStatusText(deliveryStatus.status)}
              </Badge>
              <div className="text-right">
                <p className="text-sm text-gray-500">Estimated Time</p>
                <p className="font-semibold text-gray-800">{deliveryStatus.estimatedTime}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{deliveryStatus.currentLocation}</span>
            </div>
          </CardContent>
        </Card>

        {/* Live Map Simulation */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Live Location</h3>
            <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center relative">
              <div className="text-center">
                <Truck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Delivery Partner Location</p>
                <p className="text-xs text-gray-500 mt-1">{deliveryStatus.currentLocation}</p>
              </div>
              
              {/* Simulated delivery path */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-600">Moving towards you</span>
                    </div>
                    <span className="text-xs text-gray-500">2.5 km away</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Person Details */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Delivery Partner</h3>
            <div className="flex items-center space-x-3">
              <img 
                src={deliveryStatus.deliveryPerson.photo} 
                alt={deliveryStatus.deliveryPerson.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-800">{deliveryStatus.deliveryPerson.name}</p>
                <p className="text-sm text-gray-500">⭐ {deliveryStatus.deliveryPerson.rating} • {deliveryStatus.deliveryPerson.vehicleNumber}</p>
              </div>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Phone className="w-4 h-4 mr-1" />
                Call
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Order Progress */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Order Progress</h3>
            <div className="space-y-4">
              {getStatusSteps().map((step, index) => (
                <div key={step.key} className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    step.completed ? 'bg-green-500' : 'bg-gray-200'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${step.completed ? 'text-gray-800' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                  </div>
                  {step.completed && (
                    <Clock className="w-4 h-4 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Order Details</h3>
            <div className="space-y-2 mb-4">
              {deliveryStatus.orderDetails.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} x{item.quantity}</span>
                  <span className="text-gray-800">₹{item.price}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₹{deliveryStatus.orderDetails.total}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500 mb-1">Delivery Address</p>
              <p className="text-sm text-gray-800">{deliveryStatus.orderDetails.deliveryAddress}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}