import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useLocation } from "wouter";
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function SignUp() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    agreeToTerms: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Will implement OTP verification next
    console.log("Sign up form submitted:", formData);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 py-2 text-black text-sm font-medium">
        <span>9:40</span>
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black/40 rounded-full"></div>
          </div>
          <div className="ml-1">
            <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
              <path d="M1 4h14c.6 0 1 .4 1 1v4c0 .6-.4 1-1 1H1c-.6 0-1-.4-1-1V5c0-.6.4-1 1-1z" fill="black"/>
              <path d="M2 6h12v1H2V6z" fill="white"/>
            </svg>
          </div>
          <div className="ml-1">
            <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
              <rect x="1" y="2" width="20" height="7" rx="3.5" stroke="black" strokeWidth="1"/>
              <rect x="3" y="4" width="16" height="3" rx="1.5" fill="black"/>
              <rect x="21" y="4" width="2" height="3" rx="1" fill="black"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center px-4 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/auth/get-started")}
          className="p-2 mr-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold text-gray-800">Sign Up</h1>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="pl-12 py-4 text-lg border-gray-300 rounded-xl"
              required
            />
          </div>

          {/* Email Input */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Mail className="w-5 h-5 text-gray-400" />
            </div>
            <Input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="pl-12 py-4 text-lg border-gray-300 rounded-xl"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="pl-12 pr-12 py-4 text-lg border-gray-300 rounded-xl"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-gray-400" />
              ) : (
                <Eye className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => 
                setFormData({...formData, agreeToTerms: checked as boolean})
              }
              className="mt-1"
            />
            <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
              I agree to the healthcare{" "}
              <span className="text-blue-500 underline">Terms of Service</span>{" "}
              and{" "}
              <span className="text-blue-500 underline">Privacy Policy</span>
            </label>
          </div>

          {/* Sign Up Button */}
          <Button
            type="submit"
            disabled={!formData.agreeToTerms}
            className="w-full bg-blue-400 hover:bg-blue-500 text-white py-4 text-lg font-medium rounded-full mt-8"
          >
            Sign Up
          </Button>

          {/* Sign In Link */}
          <div className="text-center">
            <span className="text-gray-600">Don't have an account? </span>
            <Link href="/auth/signin" className="text-blue-500 font-medium">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}