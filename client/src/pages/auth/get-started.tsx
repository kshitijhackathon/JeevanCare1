import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import vectorIcon from "@assets/Group 142.png";

export default function GetStarted() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

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