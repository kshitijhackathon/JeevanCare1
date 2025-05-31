import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Droplet, Scale } from "lucide-react";

export default function HealthMetrics() {
  const { user } = useAuth();

  const heartRate = user?.heartRate || 97;
  const bloodGroup = user?.bloodGroup || "A+";
  const weight = user?.weight || "103lbs";

  return (
    <section className="p-4">
      <h3 className="font-semibold text-lg text-gray-800 mb-4">Health Overview</h3>
      
      {/* Heart Rate Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl mb-4 border border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Heart rate</p>
              <p className="text-3xl font-bold text-gray-800">
                {heartRate}
                <span className="text-sm font-normal text-gray-500 ml-1">bpm</span>
              </p>
            </div>
            <div className="w-16 h-12 relative">
              {/* Simple heartbeat visualization */}
              <svg viewBox="0 0 64 48" className="w-full h-full text-primary">
                <path 
                  d="M8 24 L16 24 L20 12 L24 36 L28 12 L32 24 L56 24" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="heartbeat-line"
                />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card className="bg-gradient-error border border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Droplet className="w-4 h-4 text-red-600" />
              <p className="text-sm text-gray-600">Blood Group</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">{bloodGroup}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-warning border border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Scale className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-gray-600">Weight</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {weight}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
