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
import { UserRound, PillBottle, Ambulance, FileText, MoreHorizontal } from "lucide-react";
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
      
      <main className="pb-20">
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

        {/* AI Consultation Button */}
        <div className="px-4 mb-6">
          <Link href="/consultation">
            <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center cursor-pointer hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-800 text-lg">Consult your AI Doctor</h3>
            </div>
          </Link>
        </div>

        {/* Services Grid - Matching Your Design */}
        <div className="px-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Link href="/doctors">
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <UserRound className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Top Doctors</p>
              </div>
            </Link>
            
            <Link href="/pharmacy">
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <PillBottle className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Pharmacy</p>
              </div>
            </Link>
            
            <Link href="/ambulance">
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Ambulance className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Ambulance</p>
              </div>
            </Link>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Link href="/pharmacy">
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <PillBottle className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Pharmacy</p>
              </div>
            </Link>
            
            <Link href="/ambulance">
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Ambulance className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Ambulance</p>
              </div>
            </Link>
            
            <Link href="/pharmacy">
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <PillBottle className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Pharmacy</p>
              </div>
            </Link>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <Link href="/ambulance">
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Ambulance className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Ambulance</p>
              </div>
            </Link>
            
            <Link href="/pharmacy">
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <PillBottle className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Pharmacy</p>
              </div>
            </Link>
            
            <Link href="/ambulance">
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Ambulance className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Ambulance</p>
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
    </div>
  );
}
