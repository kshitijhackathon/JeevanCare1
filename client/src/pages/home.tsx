import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import ConsultationModal from "@/components/consultation-modal";
import EmergencyPanel from "@/components/emergency-panel";
import HealthMetrics from "@/components/health-metrics";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Bot, 
  Search, 
  FileText, 
  Ambulance, 
  TestTube, 
  Truck, 
  ScanFace, 
  UserRound, 
  Bell,
  PillBottle,
  Mic 
} from "lucide-react";
import { useState } from "react";
import type { HealthReport } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [showConsultation, setShowConsultation] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  const { data: healthReports } = useQuery<HealthReport[]>({
    queryKey: ["/api/health-reports"],
  });

  const services = [
    {
      name: "Top Doctors",
      icon: UserRound,
      color: "text-primary",
      bgColor: "bg-primary/10",
      path: "/doctors",
    },
    {
      name: "Pharmacy",
      icon: PillBottle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      path: "/pharmacy",
    },
    {
      name: "Ambulance",
      icon: Ambulance,
      color: "text-red-600",
      bgColor: "bg-red-100",
      path: "/ambulance",
    },
  ];

  return (
    <div className="mobile-container">
      <Header />
      
      <main className="pb-20 pt-20">
        {/* Welcome Section - Matching Your Design */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-2xl mb-6 mx-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Welcome !</h2>
              <p className="text-lg font-medium text-gray-600">
                {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
              </p>
              <p className="text-sm text-gray-500 mt-2">How is it going today?</p>
            </div>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <img 
                src={user?.profileImageUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64"}
                alt="Profile" 
                className="w-14 h-14 rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* AI Consultation Button - Professional */}
        <div className="px-4 mb-6">
          <Link href="/consultation">
            <div className="w-full bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-700 rounded-xl p-5 shadow-lg border border-gray-200 text-center cursor-pointer hover:shadow-xl hover:from-emerald-700 hover:via-blue-700 hover:to-indigo-800 transition-all duration-500 group">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white text-lg leading-tight">AI Doctor Consultation</h3>
                  <p className="text-white/80 text-xs">Dr. Saarthi AI • Available 24/7</p>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-4 text-white/90 text-xs">
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </span>
                <span>•</span>
                <span>Instant Response</span>
                <span>•</span>
                <span>Multilingual Support</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Healthcare Services Grid */}
        <div className="px-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Health Services</h3>
          
          {/* Row 1 */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Link href="/ai-consultation">
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Bot className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">AI Doctor Consultation</p>
              </div>
            </Link>
            
            <Link href="/medicine-delivery">
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Truck className="w-6 h-6 text-teal-600" />
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">Medicine Delivery</p>
              </div>
            </Link>
            
            <Link href="/prescription">
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">Prescription</p>
              </div>
            </Link>
          </div>
          
          {/* Row 2 */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div 
              onClick={() => setShowEmergency(true)}
              className="bg-white rounded-2xl p-3 text-center shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Ambulance className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-xs font-medium text-gray-700 leading-tight">Ambulance</p>
            </div>
            
            <Link href="/book-test">
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TestTube className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">Lab Tests</p>
              </div>
            </Link>
            
            <Link href="/symptom-checker">
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Search className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">Symptom Check</p>
              </div>
            </Link>
          </div>
          
          {/* Row 3 */}
          <div className="grid grid-cols-3 gap-3">
            <Link href="/face-scan">
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ScanFace className="w-6 h-6 text-pink-600" />
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">Face Scan</p>
              </div>
            </Link>
            
            <Link href="/doctor-escalation">
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <UserRound className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">Real Doctor</p>
              </div>
            </Link>
            
            <Link href="/notifications">
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">Alerts</p>
              </div>
            </Link>
          </div>
        </div>
      </main>

      <BottomNavigation />
      
      {showConsultation && (
        <ConsultationModal 
          isOpen={showConsultation}
          onClose={() => setShowConsultation(false)}
        />
      )}
      
      {showEmergency && (
        <EmergencyPanel 
          isOpen={showEmergency}
          onClose={() => setShowEmergency(false)}
        />
      )}

      {/* Floating Health Assistant Button */}
      <Link href="/health-assistant">
        <div className="fixed bottom-20 right-4 z-50">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="relative">
              <div className="w-6 h-6 text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.1 3.89 23 5 23H19C20.1 23 21 22.1 21 21V11L15 5V9H21ZM7 9H13V7H7V9ZM7 11H17V13H7V11ZM7 15H17V17H7V15Z"/>
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
