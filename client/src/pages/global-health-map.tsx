import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Globe, Filter, Search, Info, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

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

  // Enhanced Interactive 3D Globe with Realistic Earth
  const Interactive3DGlobe = () => {
    const [rotation, setRotation] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    
    useEffect(() => {
      const interval = setInterval(() => {
        setRotation(prev => (prev + (isHovering ? 0.2 : 0.8)) % 360);
      }, 50);
      return () => clearInterval(interval);
    }, [isHovering]);

    // Continent shapes as SVG paths (simplified for performance)
    const continents = [
      { name: "Asia", path: "M180,120 Q200,100 220,120 Q240,140 220,160 Q200,180 180,160 Q160,140 180,120", color: "#22c55e" },
      { name: "Europe", path: "M140,110 Q150,100 160,110 Q170,120 160,130 Q150,140 140,130 Q130,120 140,110", color: "#3b82f6" },
      { name: "Africa", path: "M150,130 Q170,120 180,140 Q190,160 180,180 Q170,200 150,190 Q130,180 140,160 Q150,140 150,130", color: "#f59e0b" },
      { name: "North America", path: "M80,100 Q100,90 120,100 Q140,110 130,130 Q120,150 100,140 Q80,130 70,110 Q80,100 80,100", color: "#ef4444" },
      { name: "South America", path: "M90,150 Q110,140 120,160 Q130,180 120,200 Q110,220 90,210 Q70,200 80,180 Q90,160 90,150", color: "#8b5cf6" },
      { name: "Australia", path: "M220,180 Q240,170 250,180 Q260,190 250,200 Q240,210 220,200 Q200,190 210,180 Q220,180 220,180", color: "#06b6d4" }
    ];

    return (
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-black rounded-lg h-96 overflow-hidden">
        {/* Stars Background */}
        <div className="absolute inset-0">
          {[...Array(80)].map((_, i) => (
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

        {/* Professional 3D Earth Globe */}
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div 
            className="relative w-80 h-80 rounded-full transform-gpu transition-transform duration-700 hover:scale-105"
            style={{
              background: `
                radial-gradient(circle at 25% 25%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 20%, transparent 40%),
                radial-gradient(circle at 75% 75%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 30%, transparent 50%),
                radial-gradient(ellipse at center, 
                  #1e40af 0%, 
                  #1e3a8a 20%, 
                  #1d4ed8 40%, 
                  #2563eb 60%, 
                  #3b82f6 80%, 
                  #60a5fa 100%
                )
              `,
              transform: `rotateY(${rotation * 0.3}deg) rotateX(-15deg) rotateZ(${rotation * 0.1}deg)`,
              boxShadow: `
                inset -60px -60px 120px rgba(0,0,0,0.7),
                inset 40px 40px 120px rgba(255,255,255,0.1),
                0 0 120px rgba(59, 130, 246, 0.6),
                0 0 240px rgba(34, 197, 94, 0.3),
                0 40px 80px rgba(0,0,0,0.4)
              `,
              border: '2px solid rgba(255,255,255,0.1)',
              filter: 'contrast(1.1) saturate(1.2)'
            }}
          >
            {/* Realistic Ocean Layer */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 60% 40% at 30% 25%, #0ea5e9 0%, #0284c7 25%, #0369a1 50%, #075985 75%, #0c4a6e 100%),
                  radial-gradient(ellipse 40% 60% at 70% 75%, #0891b2 0%, #0e7490 30%, #155e75 60%, #164e63 100%),
                  conic-gradient(from ${rotation}deg at 50% 50%, 
                    #1e40af 0deg, #0ea5e9 60deg, #0284c7 120deg, #0369a1 180deg, #075985 240deg, #0c4a6e 300deg, #1e40af 360deg)
                `,
                transform: `rotate(${rotation * 0.2}deg)`,
                opacity: 0.95
              }}
            />

            {/* Earth Continents - Photo-realistic */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 25% 15% at 35% 30%, #654321 0%, #8b7355 30%, transparent 70%),
                  radial-gradient(ellipse 20% 12% at 55% 40%, #8b7355 0%, #a0875f 40%, transparent 80%),
                  radial-gradient(ellipse 18% 25% at 25% 50%, #cd853f 0%, #d2b48c 50%, transparent 90%),
                  radial-gradient(ellipse 30% 20% at 45% 25%, #556b2f 0%, #6b8e23 40%, transparent 85%),
                  radial-gradient(ellipse 15% 10% at 65% 35%, #8fbc8f 0%, #9acd32 60%, transparent 95%)
                `,
                transform: `rotate(${rotation * 0.15}deg)`,
                opacity: 0.8
              }}
            />

            {/* India Subcontinent - Detailed */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 12% 18% at 52% 45%, #8b7355 0%, #cd853f 40%, #d2b48c 70%, transparent 100%),
                  radial-gradient(ellipse 8% 6% at 48% 42%, #556b2f 0%, #6b8e23 50%, transparent 90%),
                  radial-gradient(ellipse 6% 4% at 50% 40%, #daa520 0%, #f4a460 60%, transparent 100%)
                `,
                transform: `rotate(${rotation * 0.1}deg)`,
                opacity: 0.9
              }}
            />

            {/* Atmospheric Cloud Cover */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 30% 15% at 25% 30%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 50%, transparent 80%),
                  radial-gradient(ellipse 25% 12% at 65% 50%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 60%, transparent 90%),
                  radial-gradient(ellipse 20% 8% at 40% 70%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 70%, transparent 100%),
                  linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)
                `,
                transform: `rotate(${rotation * 0.4}deg)`,
                opacity: 0.7
              }}
            />

            {/* Polar Ice Caps */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 40% 8% at 50% 10%, rgba(255,255,255,0.9) 0%, rgba(240,248,255,0.6) 60%, transparent 100%),
                  radial-gradient(ellipse 35% 6% at 50% 90%, rgba(255,255,255,0.8) 0%, rgba(240,248,255,0.5) 70%, transparent 100%)
                `,
                opacity: 0.8
              }}
            />

            {/* Disease Hotspots */}
            {healthData?.map((region, index) => {
              const angle = (index * 60 + rotation) % 360;
              const radius = 35;
              const x = 50 + radius * Math.cos(angle * Math.PI / 180);
              const y = 50 + radius * Math.sin(angle * Math.PI / 180);
              const depth = Math.cos(angle * Math.PI / 180);
              const isVisible = depth > -0.5;
              const scale = Math.max(0.3, (depth + 1) / 2);
              
              const getHotspotColor = (riskLevel: string) => {
                switch (riskLevel) {
                  case 'critical': return 'bg-red-500 shadow-red-500/50';
                  case 'high': return 'bg-orange-500 shadow-orange-500/50';
                  case 'medium': return 'bg-yellow-500 shadow-yellow-500/50';
                  case 'low': return 'bg-green-500 shadow-green-500/50';
                  default: return 'bg-blue-500 shadow-blue-500/50';
                }
              };
              
              if (!isVisible) return null;
              
              return (
                <div
                  key={region.id}
                  className={`absolute w-3 h-3 rounded-full ${getHotspotColor(region.riskLevel)} animate-ping cursor-pointer transform-gpu`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    opacity: scale * 0.9,
                    zIndex: Math.floor(scale * 10),
                    boxShadow: `0 0 20px ${getHotspotColor(region.riskLevel).includes('red') ? '#ef4444' : 
                                            getHotspotColor(region.riskLevel).includes('orange') ? '#f97316' :
                                            getHotspotColor(region.riskLevel).includes('yellow') ? '#eab308' :
                                            getHotspotColor(region.riskLevel).includes('green') ? '#22c55e' : '#3b82f6'}`
                  }}
                  onClick={() => setSelectedRegion(region)}
                  title={`${region.name} - ${region.riskLevel.toUpperCase()} risk`}
                />
              );
            })}

            {/* Globe Grid Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 320 320">
              {/* Longitude lines */}
              {[0, 30, 60, 90, 120, 150].map(angle => (
                <ellipse
                  key={angle}
                  cx="160"
                  cy="160"
                  rx={Math.cos(angle * Math.PI / 180) * 140}
                  ry="140"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1"
                  transform={`rotate(${angle} 160 160)`}
                />
              ))}
              {/* Latitude lines */}
              {[-60, -30, 0, 30, 60].map(lat => (
                <ellipse
                  key={lat}
                  cx="160"
                  cy="160"
                  rx="140"
                  ry={Math.cos(lat * Math.PI / 180) * 140}
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                />
              ))}
            </svg>

            {/* Atmospheric glow */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, transparent 70%, rgba(59, 130, 246, 0.3) 85%, rgba(34, 197, 94, 0.2) 100%)`,
                filter: 'blur(2px)'
              }}
            />
          </div>

          {/* Globe Info Display */}
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur text-white p-3 rounded-lg">
            <h3 className="font-bold text-sm">🌍 Global Health Monitor</h3>
            <p className="text-xs opacity-80">Live Disease Tracking</p>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs">Active Monitoring</span>
            </div>
          </div>

          {/* Risk Level Legend */}
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur text-white p-3 rounded-lg">
            <h4 className="text-xs font-semibold mb-2">Risk Levels</h4>
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