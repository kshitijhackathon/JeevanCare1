import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import ConsultationModal from "@/components/consultation-modal";
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
        {/* Welcome Section */}
        <section className="p-4 bg-gradient-healthcare">
          <div className="flex items-center space-x-4 mb-4">
            <img 
              src={user?.profileImageUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"}
              alt="User profile" 
              className="w-16 h-16 rounded-full object-cover shadow-md"
            />
            <div>
              <h2 className="font-semibold text-lg text-gray-800">
                Welcome {user?.firstName || "there"}!
              </h2>
              <p className="text-sm text-gray-600">How are you feeling today?</p>
            </div>
          </div>
          
          {/* AI Consultation Card */}
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">Consult your AI Doctor</h3>
                <p className="text-xs text-gray-500 mt-1">Quick symptom analysis</p>
              </div>
              <Button 
                onClick={() => setShowConsultation(true)}
                className="btn-secondary text-sm"
              >
                Start
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Quick Services Grid */}
        <section className="p-4">
          <h3 className="font-semibold text-lg text-gray-800 mb-4">Quick Services</h3>
          <div className="grid grid-cols-3 gap-4">
            {services.map((service) => (
              <Link key={service.name} href={service.path}>
                <Card className="card-hover text-center cursor-pointer">
                  <CardContent className="p-4">
                    <div className={`w-12 h-12 ${service.bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
                      <service.icon className={`w-6 h-6 ${service.color}`} />
                    </div>
                    <p className="text-sm font-medium text-gray-700">{service.name}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Health Overview */}
        <HealthMetrics />

        {/* Latest Reports */}
        <section className="p-4">
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800">Latest Reports</h4>
                <Button variant="ghost" size="sm" className="text-secondary">
                  See all
                </Button>
              </div>
              
              {healthReports && healthReports.length > 0 ? (
                <div className="space-y-3">
                  {healthReports.slice(0, 2).map((report) => (
                    <div key={report.id} className="flex items-center space-x-3 py-3 border-b border-gray-100 last:border-b-0">
                      <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{report.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(report.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No health reports available</p>
                  <p className="text-xs">Start a consultation to generate reports</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <BottomNavigation />
      
      {showConsultation && (
        <ConsultationModal 
          isOpen={showConsultation}
          onClose={() => setShowConsultation(false)}
        />
      )}
    </div>
  );
}
