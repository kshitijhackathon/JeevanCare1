import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, Phone, CheckCircle, Truck, Package } from "lucide-react";

interface DeliveryStatus {
  status: 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered';
  estimatedTime: number; // in minutes
  deliveryBoy: {
    name: string;
    phone: string;
    rating: number;
  };
  timeline: {
    step: string;
    time: string;
    completed: boolean;
  }[];
}

export default function MedicineDelivery() {
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>({
    status: 'confirmed',
    estimatedTime: 20,
    deliveryBoy: {
      name: "Rahul Kumar",
      phone: "+91 98765 43210",
      rating: 4.8
    },
    timeline: [
      { step: "Order Confirmed", time: "2:45 PM", completed: true },
      { step: "Medicine Packed", time: "2:50 PM", completed: true },
      { step: "Out for Delivery", time: "3:05 PM", completed: false },
      { step: "Delivered", time: "Expected 3:25 PM", completed: false }
    ]
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // Simulate delivery progress
      setDeliveryStatus(prev => {
        const newEstimatedTime = Math.max(0, prev.estimatedTime - 1);
        let newStatus = prev.status;
        
        if (newEstimatedTime <= 15 && prev.status === 'confirmed') {
          newStatus = 'preparing';
        } else if (newEstimatedTime <= 10 && prev.status === 'preparing') {
          newStatus = 'out_for_delivery';
        } else if (newEstimatedTime <= 0 && prev.status === 'out_for_delivery') {
          newStatus = 'delivered';
        }
        
        return {
          ...prev,
          estimatedTime: newEstimatedTime,
          status: newStatus
        };
      });
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-yellow-500';
      case 'out_for_delivery': return 'bg-orange-500';
      case 'delivered': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Order Confirmed';
      case 'preparing': return 'Medicines Being Packed';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      default: return 'Processing';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center">
        <Link href="/pharmacy">
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">Track Your Order</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Delivery Status Card */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 ${getStatusColor(deliveryStatus.status)} rounded-full flex items-center justify-center mx-auto mb-4`}>
                {deliveryStatus.status === 'delivered' ? (
                  <CheckCircle className="w-8 h-8 text-white" />
                ) : deliveryStatus.status === 'out_for_delivery' ? (
                  <Truck className="w-8 h-8 text-white" />
                ) : (
                  <Package className="w-8 h-8 text-white" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                {getStatusText(deliveryStatus.status)}
              </h2>
              <p className="text-gray-600 mt-1">
                {deliveryStatus.status === 'delivered' 
                  ? 'Your medicines have been delivered!'
                  : `Estimated delivery in ${deliveryStatus.estimatedTime} minutes`
                }
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Order Progress</span>
                <span className="text-sm font-medium text-blue-600">
                  {deliveryStatus.status === 'delivered' ? '100%' : 
                   deliveryStatus.status === 'out_for_delivery' ? '75%' :
                   deliveryStatus.status === 'preparing' ? '50%' : '25%'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: deliveryStatus.status === 'delivered' ? '100%' : 
                           deliveryStatus.status === 'out_for_delivery' ? '75%' :
                           deliveryStatus.status === 'preparing' ? '50%' : '25%'
                  }}
                />
              </div>
            </div>

            {/* Live Map Placeholder */}
            <div className="bg-gray-100 h-48 rounded-lg mb-6 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">Live Tracking</p>
                <p className="text-sm text-gray-500">
                  {deliveryStatus.status === 'out_for_delivery' 
                    ? 'Delivery partner is on the way' 
                    : 'Preparing your order at pharmacy'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Partner Info */}
        {deliveryStatus.status === 'out_for_delivery' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Delivery Partner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-blue-600">
                      {deliveryStatus.deliveryBoy.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{deliveryStatus.deliveryBoy.name}</p>
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm text-gray-600">{deliveryStatus.deliveryBoy.rating}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deliveryStatus.timeline.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    item.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1">
                    <p className={`font-medium ${
                      item.completed ? 'text-gray-800' : 'text-gray-500'
                    }`}>
                      {item.step}
                    </p>
                    <p className="text-sm text-gray-500">{item.time}</p>
                  </div>
                  {item.completed && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Order ID:</span>
                <span className="font-medium">#MED2024001</span>
              </div>
              <div className="flex justify-between">
                <span>Items:</span>
                <span>2 medicines</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-medium">₹298</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <Badge variant="outline" className="text-green-600">Paid</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {deliveryStatus.status === 'delivered' ? (
            <>
              <Button className="w-full" size="lg">
                Rate Your Experience
              </Button>
              <Link href="/pharmacy">
                <Button variant="outline" className="w-full" size="lg">
                  Order Again
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Button variant="outline" className="w-full">
                Need Help?
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}