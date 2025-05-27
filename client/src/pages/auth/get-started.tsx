import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import vectorIcon from "@assets/Group 142.png";

export default function GetStarted() {
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src={vectorIcon} 
            alt="JeevanCare Logo" 
            className="w-20 h-24 mx-auto mb-6"
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Healthcare
        </h1>
        
        {/* Subtitle */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Let's get started!
        </h2>
        
        <p className="text-gray-500 text-sm mb-12">
          Login to Stay healthy and fit
        </p>

        {/* Buttons */}
        <div className="w-full max-w-sm space-y-4">
          <Link href="/auth/signin">
            <Button className="w-full bg-blue-400 hover:bg-blue-500 text-white py-4 text-lg font-medium rounded-full">
              Login
            </Button>
          </Link>
          
          <Link href="/auth/signup">
            <Button 
              variant="outline" 
              className="w-full border-2 border-blue-400 text-blue-400 hover:bg-blue-50 py-4 text-lg font-medium rounded-full"
            >
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}