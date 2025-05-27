import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeartHandshake, Shield, Users, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="mobile-container">
      {/* Hero Section */}
      <div className="min-h-screen flex flex-col justify-center p-6 bg-gradient-healthcare">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <HeartHandshake className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Welcome to <span className="text-primary">JeevanCare</span>
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            Your AI-powered health companion for better healthcare management
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">AI Symptom Checker</h3>
                <p className="text-sm text-gray-600">Get instant health insights</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Online Pharmacy</h3>
                <p className="text-sm text-gray-600">Order medicines safely</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Doctor Consultations</h3>
                <p className="text-sm text-gray-600">Connect with professionals</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Button 
          onClick={handleLogin}
          className="btn-primary w-full text-lg py-6"
        >
          Get Started
        </Button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Join thousands of users managing their health with JeevanCare
        </p>
      </div>
    </div>
  );
}
