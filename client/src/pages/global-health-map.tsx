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

        {/* Realistic 3D Earth Globe */}
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div 
            className="relative w-80 h-80 rounded-full transform-gpu transition-transform duration-500 hover:scale-110"
            style={{
              background: `
                radial-gradient(circle at 30% 20%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 25%, transparent 50%),
                radial-gradient(circle at 70% 80%, rgba(0,0,0,0.4) 0%, transparent 50%),
                linear-gradient(135deg, 
                  #1e3a8a 0%, 
                  #1e40af 15%, 
                  #2563eb 30%, 
                  #3b82f6 45%, 
                  #60a5fa 60%, 
                  #93c5fd 75%, 
                  #dbeafe 90%, 
                  #eff6ff 100%
                )
              `,
              transform: `rotateY(${rotation * 0.5}deg) rotateX(-10deg)`,
              boxShadow: `
                inset -40px -40px 80px rgba(0,0,0,0.6),
                inset 30px 30px 80px rgba(255,255,255,0.2),
                0 0 100px rgba(59, 130, 246, 0.8),
                0 0 200px rgba(34, 197, 94, 0.4),
                0 30px 60px rgba(0,0,0,0.3)
              `,
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            {/* Ocean Base Layer */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: `
                  radial-gradient(ellipse at 40% 30%, #0ea5e9 0%, #0284c7 30%, #0369a1 60%, #075985 100%),
                  radial-gradient(ellipse at 60% 70%, rgba(6, 182, 212, 0.8) 0%, transparent 40%)
                `,
                transform: `rotate(${rotation * 0.3}deg)`,
                opacity: 0.9
              }}
            />

            {/* Realistic Continent Shapes */}
            <svg 
              className="absolute inset-0 w-full h-full" 
              viewBox="0 0 400 400"
              style={{ transform: `rotate(${rotation * 0.2}deg)` }}
            >
              {/* India and South Asia - More Realistic */}
              <g>
                <path
                  d="M220,180 Q235,175 250,185 Q265,195 270,210 Q275,225 270,240 Q265,255 250,265 Q235,270 220,265 Q205,260 195,245 Q190,230 195,215 Q200,200 210,190 Q215,185 220,180 Z"
                  fill="#8b7355"
                  opacity="0.9"
                  stroke="#654321"
                  strokeWidth="1"
                />
                {/* Himalayas */}
                <path
                  d="M195,175 Q220,170 245,175 Q270,180 275,185"
                  fill="none"
                  stroke="#a0a0a0"
                  strokeWidth="2"
                  opacity="0.8"
                />
              </g>

              {/* Africa */}
              <g>
                <path
                  d="M170,160 Q180,150 190,160 Q200,170 205,185 Q210,200 205,220 Q200,240 195,255 Q190,270 180,280 Q170,285 160,280 Q150,275 145,260 Q140,245 145,230 Q150,215 155,200 Q160,185 165,170 Q170,160 170,160 Z"
                  fill="#d4a574"
                  opacity="0.9"
                  stroke="#b8956a"
                  strokeWidth="1"
                />
                {/* Sahara Desert */}
                <ellipse cx="175" cy="185" rx="15" ry="8" fill="#e6d3a3" opacity="0.7"/>
              </g>

              {/* Europe */}
              <g>
                <path
                  d="M160,140 Q170,135 180,140 Q190,145 185,155 Q180,160 170,155 Q160,150 155,145 Q160,140 160,140 Z"
                  fill="#7fad6b"
                  opacity="0.9"
                  stroke="#6b9558"
                  strokeWidth="1"
                />
              </g>

              {/* Asia */}
              <g>
                <path
                  d="M190,120 Q220,115 250,125 Q280,135 290,150 Q300,165 295,180 Q290,195 275,200 Q260,205 245,200 Q230,195 215,185 Q200,175 190,160 Q185,145 190,130 Q190,120 190,120 Z"
                  fill="#9db87a"
                  opacity="0.9"
                  stroke="#8aa567"
                  strokeWidth="1"
                />
                {/* Siberia */}
                <ellipse cx="240" cy="130" rx="25" ry="10" fill="#b5c49a" opacity="0.6"/>
              </g>

              {/* Middle East */}
              <g>
                <path
                  d="M180,165 Q195,160 210,165 Q225,170 220,180 Q215,185 200,180 Q185,175 180,170 Q180,165 180,165 Z"
                  fill="#d4b896"
                  opacity="0.8"
                  stroke="#c2a684"
                  strokeWidth="1"
                />
              </g>

              {/* Cloud patterns */}
              <g opacity="0.3">
                <ellipse cx="180" cy="150" rx="20" ry="8" fill="white" opacity="0.4"/>
                <ellipse cx="240" cy="190" rx="15" ry="6" fill="white" opacity="0.3"/>
                <ellipse cx="200" cy="220" rx="18" ry="7" fill="white" opacity="0.35"/>
              </g>
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