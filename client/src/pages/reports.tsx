import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MoreHorizontal, Activity, Droplet, Weight } from "lucide-react";
import type { HealthReport } from "@shared/schema";

export default function Reports() {
  const { user } = useAuth();

  const { data: healthReports } = useQuery<HealthReport[]>({
    queryKey: ["/api/health-reports"],
  });

  return (
    <div className="mobile-container">
      <Header />
      
      <main className="pb-20">
        {/* Health Metrics Section - Matching Your Design */}
        <div className="p-4">
          {/* Heart Rate Card */}
          <Card className="mb-4 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Heart rate</p>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-800">97</span>
                    <span className="text-sm text-gray-500 ml-1">bpm</span>
                  </div>
                </div>
                <div className="w-20 h-12 flex items-center justify-end">
                  <Activity className="w-16 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blood Group and Weight Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="bg-gradient-to-r from-red-50 to-red-100">
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Droplet className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">Blood Group</p>
                <p className="text-2xl font-bold text-gray-800">A+</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Weight className="w-4 h-4 text-yellow-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">Weight</p>
                <p className="text-xl font-bold text-gray-800">103lbs</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Latest Reports Section */}
        <div className="px-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Latest report</h3>
          
          {healthReports && healthReports.length > 0 ? (
            <div className="space-y-3">
              {healthReports.map((report) => (
                <Card key={report.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{report.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(report.createdAt!).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Sample Reports - Matching Your Design */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">General report</p>
                      <p className="text-sm text-gray-500">Jul 10, 2023</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">General report</p>
                      <p className="text-sm text-gray-500">Jul 5, 2023</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}