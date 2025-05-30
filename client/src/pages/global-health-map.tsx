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
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.8 + 0.2
              }}
            />
          ))}
        </div>

        {/* 3D Earth Globe */}
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div 
            className="relative w-80 h-80 rounded-full transform-gpu transition-transform duration-300 hover:scale-105"
            style={{
              background: `
                radial-gradient(circle at 25% 25%, rgba(255,255,255,0.4) 0%, transparent 50%),
                conic-gradient(from ${rotation}deg, #1e40af 0deg, #059669 60deg, #0891b2 120deg, #7c3aed 180deg, #dc2626 240deg, #ea580c 300deg, #1e40af 360deg)
              `,
              transform: `rotateY(${rotation}deg) rotateX(-15deg)`,
              boxShadow: `
                inset -30px -30px 60px rgba(0,0,0,0.4),
                inset 20px 20px 60px rgba(255,255,255,0.1),
                0 0 80px rgba(59, 130, 246, 0.6),
                0 0 120px rgba(34, 197, 94, 0.3)
              `,
              border: '2px solid rgba(255,255,255,0.1)'
            }}
          >
            {/* Ocean texture overlay */}
            <div 
              className="absolute inset-0 rounded-full opacity-60"
              style={{
                background: `
                  radial-gradient(ellipse at 30% 30%, rgba(6, 182, 212, 0.8) 0%, transparent 70%),
                  radial-gradient(ellipse at 70% 70%, rgba(34, 197, 94, 0.6) 0%, transparent 60%),
                  linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)
                `,
                transform: `rotate(${rotation * 0.5}deg)`
              }}
            />

            {/* Continent overlays */}
            <svg 
              className="absolute inset-0 w-full h-full" 
              viewBox="0 0 320 320"
              style={{ transform: `rotate(${rotation * 0.3}deg)` }}
            >
              {continents.map((continent, index) => (
                <g key={continent.name}>
                  <path
                    d={continent.path}
                    fill={continent.color}
                    opacity="0.7"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1"
                    className="animate-pulse"
                    style={{ animationDelay: `${index * 0.5}s` }}
                  />
                </g>
              ))}
            </svg>

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