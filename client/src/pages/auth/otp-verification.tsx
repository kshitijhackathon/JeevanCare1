import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function OTPVerification() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Get email from session storage or URL params
    const storedEmail = sessionStorage.getItem('pendingEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // Redirect back to signup if no email found
      setLocation('/auth/signup');
    }
  }, [navigate]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter the complete 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/auth/verify-otp", {
        email,
        otp: otpCode,
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Account created successfully. Welcome to JeevanCare!",
        });
        
        // Store JWT token
        localStorage.setItem('authToken', data.token);
        
        // Clear pending email
        sessionStorage.removeItem('pendingEmail');
        
        // Redirect to home
        window.location.href = '/';
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast({
        title: "Error",
        description: "Failed to verify code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      // Call resend OTP endpoint (you'll need to implement this)
      toast({
        title: "Code Sent",
        description: "A new verification code has been sent to your email",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend code. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/auth/signup")}
          className="p-2 mr-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold text-gray-800">Email Verification</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-sm mx-auto text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Check your email
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-8">
            We've sent a 6-digit verification code to{' '}
            <span className="font-medium text-gray-800">{email}</span>
          </p>

          {/* OTP Input */}
          <div className="flex justify-center gap-3 mb-8">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-semibold border-2 rounded-xl"
                disabled={isLoading}
              />
            ))}
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerifyOTP}
            disabled={isLoading || otp.join('').length !== 6}
            className="w-full bg-blue-400 hover:bg-blue-500 text-white py-4 text-lg font-medium rounded-full mb-4"
          >
            {isLoading ? "Verifying..." : "Verify Email"}
          </Button>

          {/* Resend */}
          <div className="text-center">
            <span className="text-gray-600">Didn't receive the code? </span>
            <button
              onClick={handleResendOTP}
              className="text-blue-500 font-medium hover:underline"
              disabled={isLoading}
            >
              Resend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}