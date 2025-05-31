import { useState, useEffect, useRef, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Globe, Filter, Search, Info, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Text } from "@react-three/drei";
import * as THREE from "three";

interface DiseaseData {
  disease: string;
  cases: number;
  trend: 'up' | 'down' | 'stable';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface RegionData {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number];
  totalCases: number;
  population: number;
  diseases: DiseaseData[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: string;
}

export default function GlobalHealthMap() {
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'heatmap' | 'list'>('heatmap');

  // Fetch global health data
  const { data: healthData, isLoading } = useQuery<RegionData[]>({
    queryKey: ['/api/global-health-data', selectedDisease],
    queryFn: async () => {
      const response = await fetch(`/api/global-health-data?disease=${selectedDisease}`);
      if (!response.ok) throw new Error('Failed to fetch health data');
      return response.json();
    }
  });

  const diseaseOptions = [
    { value: 'all', label: 'All Diseases' },
    { value: 'respiratory', label: 'Respiratory Infections' },
    { value: 'diarrheal', label: 'Diarrheal Diseases' },
    { value: 'dengue', label: 'Dengue Fever' },
    { value: 'malaria', label: 'Malaria' },
    { value: 'chikungunya', label: 'Chikungunya' },
    { value: 'cholera', label: 'Cholera' },
    { value: 'tuberculosis', label: 'Tuberculosis' }
  ];

  // Earth Globe 3D Component
  const EarthGlobe = ({ healthData }: { healthData: RegionData[] }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state, delta) => {
      if (meshRef.current) {
        meshRef.current.rotation.y += hovered ? delta * 0.2 : delta * 0.5;
      }
    });

    // Create earth texture using canvas
    const createEarthTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;

      // Ocean blue background
      const gradient = ctx.createLinearGradient(0, 0, 512, 256);
      gradient.addColorStop(0, '#1e40af');
      gradient.addColorStop(0.5, '#2563eb');
      gradient.addColorStop(1, '#3b82f6');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 256);

      // Add continent shapes
      ctx.fillStyle = '#22c55e';
      // North America
      ctx.beginPath();
      ctx.ellipse(80, 80, 40, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      // Europe & Asia
      ctx.beginPath();
      ctx.ellipse(300, 70, 80, 25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Africa
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.ellipse(280, 130, 25, 40, 0, 0, Math.PI * 2);
      ctx.fill();

      // India highlighted
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.ellipse(350, 120, 8, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // South America
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.ellipse(120, 180, 20, 35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Australia
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.ellipse(420, 200, 25, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      return new THREE.CanvasTexture(canvas);
    };

    const earthTexture = createEarthTexture();

    return (
      <group>
        <Sphere
          ref={meshRef}
          args={[2, 64, 32]}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <meshStandardMaterial
            map={earthTexture}
            roughness={0.8}
            metalness={0.1}
          />
        </Sphere>

        {/* Disease Hotspots as 3D markers */}
        {healthData?.map((region, index) => {
          const phi = (region.coordinates[0] + 90) * (Math.PI / 180);
          const theta = (region.coordinates[1] + 180) * (Math.PI / 180);
          const radius = 2.1;

          const x = radius * Math.sin(phi) * Math.cos(theta);
          const y = radius * Math.cos(phi);
          const z = radius * Math.sin(phi) * Math.sin(theta);

          const getColor = (riskLevel: string) => {
            switch (riskLevel) {
              case 'critical': return '#ef4444';
              case 'high': return '#f97316';
              case 'medium': return '#eab308';
              case 'low': return '#22c55e';
              default: return '#3b82f6';
            }
          };

          return (
            <group key={region.id} position={[x, y, z]}>
              <Sphere args={[0.05, 16, 16]}>
                <meshBasicMaterial color={getColor(region.riskLevel)} />
              </Sphere>
              <pointLight
                color={getColor(region.riskLevel)}
                intensity={0.5}
                distance={1}
              />
            </group>
          );
        })}

        {/* Atmosphere glow */}
        <Sphere args={[2.2, 32, 16]}>
          <meshBasicMaterial
            color="#60a5fa"
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </Sphere>
      </group>
    );
  };

  // Enhanced Interactive 3D Globe with React Three Fiber
  const Interactive3DGlobe = () => {
    return (
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-black rounded-lg h-96 overflow-hidden">
        {/* Stars Background */}
        <div className="absolute inset-0">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute w-px h-px bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: Math.random() * 0.9 + 0.1
              }}
            />
          ))}
        </div>

        {/* 3D Canvas */}
        <Canvas
          className="w-full h-full"
          camera={{ position: [0, 0, 5], fov: 60 }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <EarthGlobe healthData={healthData || []} />
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              minDistance={3}
              maxDistance={10}
              autoRotate
              autoRotateSpeed={0.5}
            />
          </Suspense>
        </Canvas>

        {/* Globe Info Display */}
        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur text-white p-3 rounded-lg">
          <h3 className="font-bold text-sm flex items-center">
            <Globe className="w-4 h-4 mr-2" />
            Global Health Monitor
          </h3>
          <p className="text-xs opacity-80">Real-time Disease Tracking</p>
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs">Active Monitoring</span>
          </div>
        </div>

        {/* Risk Level Legend */}
        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur text-white p-3 rounded-lg">
          <h4 className="text-xs font-semibold mb-2 flex items-center">
            <Info className="w-3 h-3 mr-1" />
            Risk Levels
          </h4>
          <div className="space-y-1">
            {[
              { level: 'Critical', color: 'bg-red-500', count: healthData?.filter(r => r.riskLevel === 'critical').length || 0 },
              { level: 'High', color: 'bg-orange-500', count: healthData?.filter(r => r.riskLevel === 'high').length || 0 },
              { level: 'Medium', color: 'bg-yellow-500', count: healthData?.filter(r => r.riskLevel === 'medium').length || 0 },
              { level: 'Low', color: 'bg-green-500', count: healthData?.filter(r => r.riskLevel === 'low').length || 0 }
            ].map(item => (
              <div key={item.level} className="flex items-center space-x-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${item.color} animate-pulse`}></div>
                <span>{item.level} ({item.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls Hint */}
        <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur text-white p-2 rounded-lg">
          <p className="text-xs opacity-80">Drag to rotate • Scroll to zoom</p>
        </div>
      </div>
    );
  };

  return (
    <div className="mobile-container bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Global Health Map</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Disease Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Filter by Disease</label>
                <select 
                  className="w-full p-2 border rounded-lg text-sm"
                  value={selectedDisease}
                  onChange={(e) => setSelectedDisease(e.target.value)}
                >
                  {diseaseOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="text-sm font-medium mb-2 block">Search Regions</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by region or country..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex space-x-2">
                <Button
                  variant={viewMode === 'heatmap' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('heatmap')}
                  className="flex-1"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  3D Globe
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex-1"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  List View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3D Globe View */}
        {viewMode === 'heatmap' && (
          <Card>
            <CardHeader>
              <CardTitle>Interactive 3D Global Health Map</CardTitle>
            </CardHeader>
            <CardContent>
              <Interactive3DGlobe />
              {selectedRegion && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900">{selectedRegion.name}, {selectedRegion.country}</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Total Cases: {selectedRegion.totalCases.toLocaleString()} | 
                    Population: {selectedRegion.population.toLocaleString()} | 
                    Risk Level: <span className="font-medium">{selectedRegion.riskLevel.toUpperCase()}</span>
                  </p>
                  <div className="mt-2 space-y-1">
                    {selectedRegion.diseases.slice(0, 3).map((disease, idx) => (
                      <div key={idx} className="text-xs text-blue-600 flex justify-between">
                        <span>{disease.disease}</span>
                        <span>{disease.cases.toLocaleString()} cases</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Global Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Global Health Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {healthData?.reduce((acc, region) => acc + region.totalCases, 0)?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-blue-700">Total Cases</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {healthData?.length || 0}
                </p>
                <p className="text-sm text-green-700">Monitored Regions</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {healthData?.filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high').length || 0}
                </p>
                <p className="text-sm text-red-700">High Risk Areas</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {diseaseOptions.length - 1}
                </p>
                <p className="text-sm text-orange-700">Tracked Diseases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="w-5 h-5" />
              <span>Health Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-blue-900 mb-1">🌍 Global Trends</p>
                <p className="text-blue-800">
                  Respiratory diseases show seasonal patterns across regions. Northern hemisphere experiencing winter surge.
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="font-medium text-yellow-900 mb-1">⚠️ Watch Areas</p>
                <p className="text-yellow-800">
                  Tropical regions showing increased vector-borne disease activity. Enhanced monitoring recommended.
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="font-medium text-green-900 mb-1">✅ Positive Developments</p>
                <p className="text-green-800">
                  Vaccination campaigns showing effectiveness in reducing severe outcomes across monitored regions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}