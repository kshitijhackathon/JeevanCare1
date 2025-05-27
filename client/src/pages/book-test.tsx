import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, Clock, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TestBooking {
  testType: string;
  date: string;
  timeSlot: string;
  address: string;
  pincode: string;
  phone: string;
  paymentMethod: string;
}

export default function BookTest() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [booking, setBooking] = useState<TestBooking>({
    testType: '',
    date: '',
    timeSlot: '',
    address: '',
    pincode: '',
    phone: '',
    paymentMethod: ''
  });

  const timeSlots = [
    { value: '09:00', label: '9:00 AM - 10:00 AM' },
    { value: '10:00', label: '10:00 AM - 11:00 AM' },
    { value: '11:00', label: '11:00 AM - 12:00 PM' },
    { value: '14:00', label: '2:00 PM - 3:00 PM' },
    { value: '15:00', label: '3:00 PM - 4:00 PM' },
    { value: '16:00', label: '4:00 PM - 5:00 PM' },
    { value: '17:00', label: '5:00 PM - 6:00 PM' }
  ];

  const testTypes = [
    { value: 'blood-test', label: 'Complete Blood Count (CBC)', price: 299 },
    { value: 'sugar-test', label: 'Blood Sugar Test', price: 199 },
    { value: 'lipid-profile', label: 'Lipid Profile', price: 599 },
    { value: 'thyroid-test', label: 'Thyroid Function Test', price: 799 },
    { value: 'liver-function', label: 'Liver Function Test', price: 699 },
    { value: 'kidney-function', label: 'Kidney Function Test', price: 599 }
  ];

  const paymentMethods = [
    { value: 'upi', label: '💳 UPI Payment', icon: '📱' },
    { value: 'card', label: '💳 Credit/Debit Card', icon: '💳' },
    { value: 'netbanking', label: '🏦 Net Banking', icon: '🏦' },
    { value: 'cash', label: '💵 Cash on Collection', icon: '💵' }
  ];

  const bookTest = useMutation({
    mutationFn: async (bookingData: TestBooking) => {
      const response = await apiRequest("POST", "/api/test-booking", bookingData);
      if (!response.ok) throw new Error("Failed to book test");
      return response.json();
    },
    onSuccess: () => {
      setStep('success');
      toast({
        title: "Test Booked Successfully!",
        description: "Your home collection has been scheduled.",
      });
    },
    onError: () => {
      toast({
        title: "Booking Failed",
        description: "Failed to book test. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleBooking = () => {
    if (booking.paymentMethod === 'cash') {
      bookTest.mutate(booking);
    } else {
      setStep('payment');
    }
  };

  const handlePayment = () => {
    // Simulate payment processing
    setTimeout(() => {
      bookTest.mutate(booking);
    }, 2000);
  };

  const selectedTest = testTypes.find(test => test.value === booking.testType);

  if (step === 'details') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Book Lab Test at Home</h1>
        </div>

        <div className="p-4 space-y-4">
          {/* Test Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testType">Test Type</Label>
                <Select onValueChange={(value) => setBooking({...booking, testType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    {testTypes.map((test) => (
                      <SelectItem key={test.value} value={test.value}>
                        {test.label} - ₹{test.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Schedule Collection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={booking.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBooking({...booking, date: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="timeSlot">Time Slot</Label>
                <Select onValueChange={(value) => setBooking({...booking, timeSlot: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Address Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Collection Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Full Address</Label>
                <Textarea
                  id="address"
                  value={booking.address}
                  onChange={(e) => setBooking({...booking, address: e.target.value})}
                  placeholder="Enter your complete address with landmarks"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={booking.pincode}
                    onChange={(e) => setBooking({...booking, pincode: e.target.value})}
                    placeholder="Enter pincode"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={booking.phone}
                    onChange={(e) => setBooking({...booking, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setBooking({...booking, paymentMethod: method.value})}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      booking.paymentMethod === method.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{method.icon}</div>
                    <div className="text-sm font-medium">{method.label}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          {selectedTest && (
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{selectedTest.label}</span>
                  <span className="font-bold">₹{selectedTest.price}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                  <span>Home collection charges</span>
                  <span>₹50</span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center font-bold">
                  <span>Total Amount</span>
                  <span>₹{selectedTest.price + 50}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Button 
            onClick={handleBooking}
            disabled={!booking.testType || !booking.date || !booking.timeSlot || !booking.address || !booking.pincode || !booking.phone || !booking.paymentMethod}
            className="w-full"
            size="lg"
          >
            {booking.paymentMethod === 'cash' ? 'Book Test' : 'Proceed to Payment'}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep('details')}
            className="mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold">Payment</h1>
        </div>

        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle>Complete Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Test:</span>
                  <span className="font-medium">{selectedTest?.label}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Date & Time:</span>
                  <span>{booking.date} at {timeSlots.find(slot => slot.value === booking.timeSlot)?.label}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total Amount:</span>
                  <span>₹{selectedTest ? selectedTest.price + 50 : 0}</span>
                </div>
              </div>

              {booking.paymentMethod === 'upi' && (
                <div className="text-center p-4">
                  <div className="w-32 h-32 bg-gray-200 mx-auto mb-4 rounded-lg flex items-center justify-center">
                    <span className="text-sm text-gray-500">QR Code for UPI</span>
                  </div>
                  <p className="text-sm text-gray-600">Scan QR code with any UPI app</p>
                </div>
              )}

              {booking.paymentMethod === 'card' && (
                <div className="space-y-3">
                  <Input placeholder="Card Number" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="MM/YY" />
                    <Input placeholder="CVV" />
                  </div>
                  <Input placeholder="Cardholder Name" />
                </div>
              )}

              {booking.paymentMethod === 'netbanking' && (
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sbi">State Bank of India</SelectItem>
                    <SelectItem value="hdfc">HDFC Bank</SelectItem>
                    <SelectItem value="icici">ICICI Bank</SelectItem>
                    <SelectItem value="axis">Axis Bank</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Button 
                onClick={handlePayment}
                disabled={bookTest.isPending}
                className="w-full"
                size="lg"
              >
                {bookTest.isPending ? "Processing..." : `Pay ₹${selectedTest ? selectedTest.price + 50 : 0}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Test Booked Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Your home collection has been scheduled for {booking.date} at {timeSlots.find(slot => slot.value === booking.timeSlot)?.label}
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                🧪 Our technician will arrive at your location<br/>
                📱 You'll receive SMS updates<br/>
                📊 Reports will be available in 24-48 hours
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/">
              <Button className="w-full">
                Go to Home
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="w-full">
                View All Reports
              </Button>
            </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}