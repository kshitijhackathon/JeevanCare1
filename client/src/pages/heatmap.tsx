import { useState, useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
import { Link } from "wouter";
import { ArrowLeft, X, TrendingUp, AlertTriangle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import * as THREE from "three";

interface ScamData {
  [region: string]: {
    total_cases: number;
    types: {
      [type: string]: number;
    };
    coordinates: [number, number];
    severity: 'low' | 'medium' | 'high';
  };
}

// 3D Globe Component
function Globe({ onRegionClick, scamData }: { onRegionClick: (region: string) => void; scamData: ScamData }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }
  });

  // India regions with approximate coordinates
  const indianRegions = [
    { name: 'Delhi', position: [0.5, 0.8, 0.3], color: '#ff4444' },
    { name: 'Mumbai', position: [-0.2, 0.2, 0.9], color: '#ff6666' },
    { name: 'Bangalore', position: [0.1, -0.3, 0.8], color: '#ff8888' },
    { name: 'Chennai', position: [0.3, -0.5, 0.7], color: '#ffaa44' },
    { name: 'Kolkata', position: [0.8, 0.4, 0.4], color: '#ff6644' },
    { name: 'Hyderabad', position: [0.2, -0.2, 0.8], color: '#ff7744' },
    { name: 'Pune', position: [-0.1, 0.1, 0.9], color: '#ff9944' },
    { name: 'Ahmedabad', position: [-0.4, 0.3, 0.7], color: '#ffbb44' }
  ];

  return (
    <group>
      {/* Main Globe */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial 
          color="#1e40af" 
          transparent 
          opacity={0.8}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      
      {/* India outline (simplified) */}
      <mesh position={[0, 0, 2.01]}>
        <planeGeometry args={[1.5, 2]} />
        <meshBasicMaterial 
          color="#22c55e" 
          transparent 
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Scam Data Points */}
      {indianRegions.map((region, index) => {
        const regionData = scamData[region.name];
        const intensity = regionData ? Math.min(regionData.total_cases / 100, 1) : 0.1;
        const scale = 0.1 + intensity * 0.3;
        
        return (
          <group key={region.name}>
            {/* Scam indicator sphere */}
            <mesh
              position={[region.position[0], region.position[1], region.position[2]]}
              scale={hovered === region.name ? [scale * 1.5, scale * 1.5, scale * 1.5] : [scale, scale, scale]}
              onClick={() => onRegionClick(region.name)}
              onPointerEnter={() => setHovered(region.name)}
              onPointerLeave={() => setHovered(null)}
            >
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial 
                color={regionData?.severity === 'high' ? '#dc2626' : 
                       regionData?.severity === 'medium' ? '#f59e0b' : '#22c55e'} 
                emissive={hovered === region.name ? '#ffffff' : '#000000'}
                emissiveIntensity={hovered === region.name ? 0.3 : 0}
              />
            </mesh>
            
            {/* Region label */}
            {hovered === region.name && (
              <Html position={[region.position[0], region.position[1] + 0.5, region.position[2]]}>
                <div className="bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                  {region.name}
                  {regionData && (
                    <div className="text-xs text-gray-300">
                      {regionData.total_cases} cases
                    </div>
                  )}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

// Loading component for 3D
function LoadingScene() {
  return (
    <Html center>
      <div className="bg-white rounded-lg p-4 shadow-lg">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading 3D Globe...</p>
      </div>
    </Html>
  );
}

export default function Heatmap() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  // Fetch scam data from backend
  const { data: scamData = {}, isLoading } = useQuery({
    queryKey: ['/api/scam-data'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/scam-data");
      if (!response.ok) throw new Error("Failed to fetch scam data");
      return response.json();
    }
  });

  const handleRegionClick = (region: string) => {
    setSelectedRegion(region);
    setShowSidebar(true);
  };

  const selectedData = selectedRegion ? scamData[selectedRegion] : null;
  const totalCases = Object.values(scamData).reduce((sum: number, region: any) => sum + (region?.total_cases || 0), 0);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white overflow-hidden">
      {/* Header */}
      <div className="relative z-10 bg-black/30 backdrop-blur-md p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Scam Heatmap</h1>
            <p className="text-sm text-gray-300">Interactive 3D visualization across India</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-red-400">{totalCases.toLocaleString()}</p>
          <p className="text-xs text-gray-300">Total Cases</p>
        </div>
      </div>

      {/* 3D Globe Canvas */}
      <div className="relative h-full">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={<LoadingScene />}>
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <spotLight position={[-10, -10, -10]} angle={0.3} intensity={0.5} />
            
            <Globe onRegionClick={handleRegionClick} scamData={scamData} />
            
            <OrbitControls 
              enableZoom={true}
              enablePan={true}
              enableRotate={true}
              minDistance={3}
              maxDistance={15}
              autoRotate={!showSidebar}
              autoRotateSpeed={0.5}
            />
          </Suspense>
        </Canvas>

        {/* Floating Stats */}
        <div className="absolute top-20 left-4 space-y-2">
          <Card className="bg-black/60 backdrop-blur-md border-gray-700 text-white">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>High Risk Areas</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/60 backdrop-blur-md border-gray-700 text-white">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Medium Risk Areas</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/60 backdrop-blur-md border-gray-700 text-white">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Low Risk Areas</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-20 right-4">
          <Card className="bg-black/60 backdrop-blur-md border-gray-700 text-white">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                How to Use
              </h3>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• Rotate: Drag to rotate the globe</li>
                <li>• Zoom: Scroll to zoom in/out</li>
                <li>• Click: Tap any red dot for details</li>
                <li>• Auto-rotate: Globe spins automatically</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Region Details Sidebar */}
      {showSidebar && selectedData && (
        <div className="fixed inset-y-0 right-0 w-80 bg-black/90 backdrop-blur-md border-l border-gray-700 z-20 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedRegion}</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSidebar(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Total Cases */}
              <Card className="bg-gradient-to-r from-red-600 to-red-700 border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm">Total Cases</p>
                      <p className="text-2xl font-bold text-white">{selectedData.total_cases.toLocaleString()}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>

              {/* Scam Types Breakdown */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Scam Types Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(selectedData.types).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={count > 100 ? "destructive" : count > 50 ? "secondary" : "outline"}>
                          {type}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">{count}</p>
                        <p className="text-xs text-gray-400">
                          {((count / selectedData.total_cases) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Risk Level */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Risk Level</span>
                    <Badge 
                      variant={selectedData.severity === 'high' ? "destructive" : 
                               selectedData.severity === 'medium' ? "secondary" : "outline"}
                      className="capitalize"
                    >
                      {selectedData.severity}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="space-y-2">
                <Button className="w-full" variant="outline">
                  View Detailed Report
                </Button>
                <Button className="w-full" variant="outline">
                  Download Data
                </Button>
                <Button className="w-full" variant="outline">
                  Set Alert for this Region
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
          <Card className="bg-black/80 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white">Loading scam data...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}