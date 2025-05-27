import { Button } from "@/components/ui/button";
import vectorIcon from "@assets/Vector.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-cyan-100 relative overflow-hidden">
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

      {/* Background Medical Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Pills scattered around */}
        <div className="absolute top-20 right-8">
          <div className="w-6 h-12 bg-blue-300/40 rounded-full rotate-45"></div>
        </div>
        <div className="absolute top-32 right-12">
          <div className="w-4 h-8 bg-cyan-300/40 rounded-full rotate-12"></div>
        </div>
        <div className="absolute top-28 right-20">
          <div className="w-5 h-10 bg-blue-400/40 rounded-full -rotate-30"></div>
        </div>
        
        {/* Stethoscope */}
        <div className="absolute bottom-20 left-4">
          <svg width="120" height="400" viewBox="0 0 120 400" className="opacity-20">
            <path d="M20 50 Q30 40 40 50 L40 200 Q40 220 60 220 Q80 220 80 200 L80 50 Q90 40 100 50" 
                  stroke="#94A3B8" strokeWidth="8" fill="none" strokeLinecap="round"/>
            <circle cx="60" cy="350" r="25" stroke="#94A3B8" strokeWidth="8" fill="none"/>
            <path d="M60 220 L60 325" stroke="#94A3B8" strokeWidth="8" strokeLinecap="round"/>
            <circle cx="20" cy="50" r="15" fill="#94A3B8" opacity="0.6"/>
            <circle cx="100" cy="50" r="15" fill="#94A3B8" opacity="0.6"/>
          </svg>
        </div>

        {/* Additional medical shapes */}
        <div className="absolute top-40 left-8">
          <div className="w-8 h-8 bg-cyan-200/30 rounded-full"></div>
        </div>
        <div className="absolute bottom-40 right-6">
          <div className="w-6 h-6 bg-blue-200/30 rounded-full"></div>
        </div>
        <div className="absolute top-60 left-12">
          <div className="w-4 h-4 bg-cyan-300/30 rounded-full"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 text-center">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src={vectorIcon} 
            alt="JeevanCare Logo" 
            className="w-24 h-24 mx-auto mb-6"
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
            onClick={() => window.location.href = '/api/login'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-medium rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}