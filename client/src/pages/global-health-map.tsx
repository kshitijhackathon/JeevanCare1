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

  // Ultra Realistic 3D Earth Globe using advanced CSS techniques
  const Interactive3DGlobe = () => {
    const [rotation, setRotation] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [globeRotation, setGlobeRotation] = useState({ x: -10, y: 0 });
    
    useEffect(() => {
      const interval = setInterval(() => {
        if (!isDragging) {
          setRotation(prev => (prev + (isHovering ? 0.1 : 0.3)) % 360);
        }
      }, 50);
      return () => clearInterval(interval);
    }, [isHovering, isDragging]);

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        setGlobeRotation(prev => ({
          x: Math.max(-45, Math.min(45, prev.x - deltaY * 0.2)),
          y: prev.y + deltaX * 0.3
        }));
        
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    return (
      <div className="relative bg-black rounded-lg h-96 overflow-hidden" style={{
        background: `
          radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%),
          url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
        `,
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}>
        {/* Realistic Star Field */}
        <div className="absolute inset-0">
          {[...Array(200)].map((_, i) => {
            const size = Math.random();
            return (
              <div
                key={i}
                className="absolute bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: size > 0.8 ? '2px' : size > 0.6 ? '1.5px' : '1px',
                  height: size > 0.8 ? '2px' : size > 0.6 ? '1.5px' : '1px',
                  opacity: Math.random() * 0.8 + 0.2,
                  animation: size > 0.9 ? 'pulse 2s ease-in-out infinite' : 'none',
                  animationDelay: `${Math.random() * 3}s`
                }}
              />
            );
          })}
        </div>

        {/* Ultra Realistic 3D Earth Globe */}
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => {
            setIsHovering(false);
            setIsDragging(false);
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ 
            perspective: '1500px',
            perspectiveOrigin: '50% 50%'
          }}
        >
          <div 
            className="relative w-80 h-80 rounded-full transition-all duration-500 hover:scale-105"
            style={{
              background: `
                radial-gradient(ellipse 200% 150% at 25% 15%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 8%, rgba(255,255,255,0.2) 20%, transparent 40%),
                radial-gradient(ellipse 150% 200% at 75% 85%, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 15%, rgba(0,0,0,0.2) 30%, transparent 50%),
                conic-gradient(from ${rotation}deg at 50% 50%, 
                  #1e3a8a 0deg, #1e40af 60deg, #1d4ed8 120deg, #2563eb 180deg, 
                  #3b82f6 240deg, #60a5fa 300deg, #1e3a8a 360deg),
                radial-gradient(circle at center, #0f172a 0%, #1e293b 30%, #334155 60%, #475569 80%, #64748b 100%)
              `,
              transform: `
                rotateX(${globeRotation.x - 5}deg) 
                rotateY(${rotation + globeRotation.y}deg)
                rotateZ(${Math.sin(rotation * Math.PI / 180) * 1}deg)
              `,
              boxShadow: `
                inset -150px -100px 250px rgba(0,0,0,0.95),
                inset 100px 80px 200px rgba(255,255,255,0.15),
                0 0 150px rgba(59, 130, 246, 1),
                0 0 300px rgba(34, 197, 94, 0.6),
                0 80px 120px rgba(0,0,0,0.9)
              `,
              border: '4px solid rgba(255,255,255,0.1)',
              filter: 'contrast(1.4) saturate(1.5) brightness(1.2)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Realistic Ocean Base */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 80% 60% at 40% 30%, #1e40af 0%, #1d4ed8 25%, #2563eb 50%, #3b82f6 75%, #60a5fa 100%),
                  radial-gradient(ellipse 60% 80% at 60% 70%, #0ea5e9 0%, #0284c7 30%, #0369a1 60%, #075985 90%)
                `,
                transform: `rotate(${rotation * 0.1}deg)`,
                opacity: 0.9
              }}
            />

            {/* North America */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 25% 35% at 25% 35%, #228b22 0%, #32cd32 30%, #9acd32 60%, transparent 85%),
                  radial-gradient(ellipse 15% 20% at 20% 30%, #8b4513 0%, #cd853f 40%, transparent 70%),
                  radial-gradient(ellipse 12% 15% at 30% 25%, #556b2f 0%, #6b8e23 50%, transparent 80%)
                `,
                transform: `rotate(${rotation * 0.08}deg)`,
                opacity: 0.85
              }}
            />

            {/* Europe and Asia */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 45% 25% at 65% 30%, #228b22 0%, #32cd32 20%, #9acd32 40%, #adff2f 60%, transparent 80%),
                  radial-gradient(ellipse 35% 20% at 70% 25%, #8b4513 0%, #cd853f 30%, #d2b48c 50%, transparent 75%),
                  radial-gradient(ellipse 25% 15% at 75% 35%, #654321 0%, #8b7355 40%, transparent 70%)
                `,
                transform: `rotate(${rotation * 0.12}deg)`,
                opacity: 0.8
              }}
            />

            {/* Africa */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 20% 35% at 55% 55%, #daa520 0%, #f4a460 25%, #cd853f 50%, #8b4513 75%, transparent 90%),
                  radial-gradient(ellipse 15% 25% at 58% 50%, #228b22 0%, #32cd32 30%, transparent 70%),
                  radial-gradient(ellipse 12% 20% at 52% 65%, #8b4513 0%, #cd853f 40%, transparent 80%)
                `,
                transform: `rotate(${rotation * 0.09}deg)`,
                opacity: 0.85
              }}
            />

            {/* South America */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 18% 40% at 35% 65%, #228b22 0%, #32cd32 25%, #9acd32 50%, transparent 80%),
                  radial-gradient(ellipse 12% 25% at 38% 60%, #8b4513 0%, #cd853f 35%, transparent 70%),
                  radial-gradient(ellipse 8% 15% at 32% 75%, #daa520 0%, #f4a460 50%, transparent 85%)
                `,
                transform: `rotate(${rotation * 0.07}deg)`,
                opacity: 0.8
              }}
            />

            {/* Australia */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 15% 12% at 75% 70%, #daa520 0%, #f4a460 40%, #cd853f 70%, transparent 90%),
                  radial-gradient(ellipse 10% 8% at 78% 68%, #8b4513 0%, #cd853f 50%, transparent 85%)
                `,
                transform: `rotate(${rotation * 0.06}deg)`,
                opacity: 0.85
              }}
            />

            {/* India Subcontinent - Highlighted */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 8% 15% at 68% 40%, #ff6b35 0%, #f7931e 30%, #ffc72c 60%, transparent 85%),
                  radial-gradient(ellipse 6% 10% at 70% 42%, #228b22 0%, #32cd32 40%, transparent 80%)
                `,
                transform: `rotate(${rotation * 0.11}deg)`,
                opacity: 0.9
              }}
            />

            {/* Realistic Cloud Cover */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 30% 15% at 30% 20%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 50%, transparent 80%),
                  radial-gradient(ellipse 25% 12% at 80% 60%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 60%, transparent 90%),
                  radial-gradient(ellipse 20% 10% at 50% 80%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 70%, transparent 100%)
                `,
                transform: `rotate(${rotation * 0.4}deg)`,
                opacity: 0.7
              }}
            />

            {/* Ice Caps */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: `
                  radial-gradient(ellipse 40% 8% at 50% 5%, rgba(255,255,255,0.9) 0%, rgba(240,248,255,0.6) 60%, transparent 100%),
                  radial-gradient(ellipse 35% 6% at 50% 95%, rgba(255,255,255,0.8) 0%, rgba(240,248,255,0.5) 70%, transparent 100%)
                `,
                opacity: 0.9
              }}
            />

            {/* Disease Hotspots with 3D effect */}
            {healthData?.map((region, index) => {
              const angle = (index * 45 + rotation * 0.8) % 360;
              const radius = 38;
              const x = 50 + radius * Math.cos(angle * Math.PI / 180);
              const y = 50 + radius * Math.sin(angle * Math.PI / 180);
              const depth = Math.cos(angle * Math.PI / 180);
              const isVisible = depth > -0.6;
              const scale = Math.max(0.4, (depth + 1) / 2);
              
              const getHotspotColor = (riskLevel: string) => {
                switch (riskLevel) {
                  case 'critical': return { bg: 'bg-red-500', glow: '#ef4444', shadow: 'shadow-red-500/70' };
                  case 'high': return { bg: 'bg-orange-500', glow: '#f97316', shadow: 'shadow-orange-500/70' };
                  case 'medium': return { bg: 'bg-yellow-500', glow: '#eab308', shadow: 'shadow-yellow-500/70' };
                  case 'low': return { bg: 'bg-green-500', glow: '#22c55e', shadow: 'shadow-green-500/70' };
                  default: return { bg: 'bg-blue-500', glow: '#3b82f6', shadow: 'shadow-blue-500/70' };
                }
              };
              
              const colors = getHotspotColor(region.riskLevel);
              
              if (!isVisible) return null;
              
              return (
                <div
                  key={region.id}
                  className={`absolute w-4 h-4 rounded-full ${colors.bg} ${colors.shadow} animate-ping cursor-pointer transform-gpu transition-all duration-300 hover:scale-150`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: `translate(-50%, -50%) scale(${scale}) perspective(100px) rotateX(${depth * 30}deg)`,
                    opacity: scale * 0.95,
                    zIndex: Math.floor(scale * 15),
                    boxShadow: `
                      0 0 30px ${colors.glow},
                      0 0 60px ${colors.glow}60,
                      inset 0 0 10px rgba(255,255,255,0.5)
                    `,
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                  onClick={() => setSelectedRegion(region)}
                  title={`${region.name} - ${region.riskLevel.toUpperCase()} risk (${region.totalCases} cases)`}
                />
              );
            })}

            {/* Enhanced Globe Grid Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-25 pointer-events-none" viewBox="0 0 320 320">
              {/* Longitude lines with perspective */}
              {[0, 30, 60, 90, 120, 150].map(angle => (
                <ellipse
                  key={angle}
                  cx="160"
                  cy="160"
                  rx={Math.abs(Math.cos(angle * Math.PI / 180)) * 140}
                  ry="140"
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1.5"
                  strokeDasharray="4,6"
                  transform={`rotate(${angle + rotation * 0.1} 160 160)`}
                />
              ))}
              {/* Latitude lines */}
              {[-60, -30, 0, 30, 60].map(lat => (
                <ellipse
                  key={lat}
                  cx="160"
                  cy="160"
                  rx="140"
                  ry={Math.abs(Math.cos(lat * Math.PI / 180)) * 140}
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1"
                  strokeDasharray="3,5"
                />
              ))}
              {/* Equator highlight */}
              <ellipse
                cx="160"
                cy="160"
                rx="140"
                ry="140"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2"
                strokeDasharray="8,4"
              />
            </svg>

            {/* Multi-layered Atmospheric Glow */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `
                  radial-gradient(circle, transparent 65%, rgba(59, 130, 246, 0.4) 80%, rgba(34, 197, 94, 0.3) 90%, rgba(147, 51, 234, 0.2) 100%)
                `,
                filter: 'blur(3px)'
              }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `
                  radial-gradient(circle, transparent 70%, rgba(34, 197, 94, 0.3) 85%, rgba(59, 130, 246, 0.2) 95%, rgba(236, 72, 153, 0.1) 100%)
                `,
                filter: 'blur(1px)',
                animation: 'pulse 4s ease-in-out infinite'
              }}
            />
          </div>

          {/* Enhanced Globe Info Display */}
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md text-white p-4 rounded-xl border border-white/20">
            <h3 className="font-bold text-sm flex items-center mb-1">
              <Globe className="w-4 h-4 mr-2 text-blue-400" />
              Global Health Monitor
            </h3>
            <p className="text-xs opacity-80 mb-2">Real-time Disease Tracking</p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs">Live Data Stream</span>
            </div>
            <div className="text-xs mt-2 opacity-70">
              Total Regions: {healthData?.length || 0}
            </div>
          </div>

          {/* Enhanced Risk Level Legend */}
          <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md text-white p-4 rounded-xl border border-white/20">
            <h4 className="text-xs font-semibold mb-3 flex items-center">
              <Info className="w-3 h-3 mr-1 text-yellow-400" />
              Risk Levels
            </h4>
            <div className="space-y-2">
              {[
                { level: 'Critical', color: 'bg-red-500', count: healthData?.filter(r => r.riskLevel === 'critical').length || 0 },
                { level: 'High', color: 'bg-orange-500', count: healthData?.filter(r => r.riskLevel === 'high').length || 0 },
                { level: 'Medium', color: 'bg-yellow-500', count: healthData?.filter(r => r.riskLevel === 'medium').length || 0 },
                { level: 'Low', color: 'bg-green-500', count: healthData?.filter(r => r.riskLevel === 'low').length || 0 }
              ].map(item => (
                <div key={item.level} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${item.color} animate-pulse shadow-lg`}></div>
                    <span>{item.level}</span>
                  </div>
                  <span className="text-gray-300 font-mono">({item.count})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Controls Hint */}
          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md text-white p-3 rounded-xl border border-white/20">
            <p className="text-xs opacity-80 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Drag to rotate • Click markers for details
            </p>
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