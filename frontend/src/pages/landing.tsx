import { Button } from "@/components/ui/button";
import vectorIcon from "@assets/Vector.png";
import medicalBg from "@assets/Group 141.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-cyan-100 relative overflow-hidden">

      {/* Background Medical Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img 
          src={medicalBg} 
          alt="Medical Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 text-center">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src={vectorIcon} 
            alt="JeevanCare Logo" 
            className="w-32 h-32 mx-auto mb-6"
          />
        </div>

        {/* App Name */}
        <h1 className="text-4xl font-normal text-gray-800 mb-2 tracking-wide">
          Jeevancare
        </h1>
        
        {/* Subtitle */}
        <p className="text-gray-600 text-lg mb-12 tracking-wide">
          Medical app
        </p>

        {/* CTA Button */}
        <div className="w-full max-w-sm">
          <Button
            onClick={() => window.location.href = '/auth/get-started'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-medium rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}