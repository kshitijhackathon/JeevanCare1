import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Globe,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  MapPin,
  Activity,
  BarChart3,
  Filter,
  Search,
  Info
} from "lucide-react";
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

  // Interactive 3D Globe with Disease Hotspots
  const Interactive3DGlobe = () => {
    const [rotation, setRotation] = useState(0);
    
    useEffect(() => {
      const interval = setInterval(() => {
        setRotation(prev => (prev + 0.5) % 360);
      }, 100);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-black rounded-lg h-80 overflow-hidden">
        {/* 3D Globe Container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="relative w-64 h-64 rounded-full bg-gradient-to-br from-blue-500 via-green-500 to-blue-600 shadow-2xl transform-gpu"
            style={{
              backgroundImage: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 30%, transparent 70%),
                               linear-gradient(45deg, #4ade80 0%, #3b82f6 25%, #10b981 50%, #1e40af 75%, #059669 100%)`,
              transform: `rotateY(${rotation}deg) rotateX(-10deg)`,
              boxShadow: `
                inset -20px -20px 50px rgba(0,0,0,0.3),
                inset 20px 20px 50px rgba(255,255,255,0.1),
                0 0 50px rgba(59, 130, 246, 0.4)
              `
            }}
          >
            {/* Disease Hotspots */}
            {healthData?.map((region, index) => {
              const angle = (index * 90 + rotation) % 360;
              const x = 50 + 35 * Math.cos(angle * Math.PI / 180);
              const y = 50 + 35 * Math.sin(angle * Math.PI / 180);
              const opacity = Math.cos(angle * Math.PI / 180) > 0 ? 1 : 0.3;
              
              const getHotspotColor = (riskLevel: string) => {
                switch (riskLevel) {
                  case 'critical': return 'bg-red-500';
                  case 'high': return 'bg-orange-500';
                  case 'medium': return 'bg-yellow-500';
                  case 'low': return 'bg-green-500';
                  default: return 'bg-blue-500';
                }
              };

              return (
                <div
                  key={region.id}
                  className={`absolute w-4 h-4 rounded-full ${getHotspotColor(region.riskLevel)} 
                            cursor-pointer transform -translate-x-1/2 -translate-y-1/2 
                            hover:scale-150 transition-all duration-300 animate-pulse`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    opacity: opacity,
                    boxShadow: `0 0 10px ${
                      region.riskLevel === 'critical' ? '#ef4444' :
                      region.riskLevel === 'high' ? '#f97316' :
                      region.riskLevel === 'medium' ? '#eab308' : '#22c55e'
                    }`
                  }}
                  onClick={() => setSelectedRegion(region)}
                  title={`${region.name} - ${region.totalCases.toLocaleString()} cases`}
                >
                  <div className="absolute inset-0 rounded-full animate-ping opacity-75"></div>
                </div>
              );
            })}

            {/* Globe Grid Lines */}
            <div className="absolute inset-0 rounded-full"
                 style={{
                   background: `
                     repeating-linear-gradient(0deg, transparent 0px, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 22px),
                     repeating-linear-gradient(90deg, transparent 0px, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 22px)
                   `,
                   clipPath: 'circle(50%)'
                 }}
            />
          </div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="absolute top-4 left-4 flex space-x-2">
          <div className="bg-white bg-opacity-90 px-3 py-1 rounded-full text-xs font-medium">
            3D Globe View
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg text-xs">
          <div className="mb-2 font-medium text-gray-800">Disease Risk Levels</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Low Risk</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>High Risk</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span>Critical</span>
            </div>
          </div>
          <div className="mt-2 text-gray-600">
            <div>• Click hotspots for details</div>
            <div>• Auto-rotating view</div>
          </div>
        </div>

        {/* Active Region Info */}
        {selectedRegion && (
          <div className="absolute top-4 right-4 bg-white bg-opacity-95 p-3 rounded-lg text-xs max-w-48">
            <div className="font-medium text-gray-800 mb-1">{selectedRegion.name}</div>
            <div className="text-gray-600 mb-2">{selectedRegion.country}</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Total Cases:</span>
                <span className="font-medium">{selectedRegion.totalCases.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Population:</span>
                <span className="font-medium">{(selectedRegion.population / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between">
                <span>Risk Level:</span>
                <Badge className={getRiskColor(selectedRegion.riskLevel)}>
                  {selectedRegion.riskLevel}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const diseaseOptions = [
    { value: 'all', label: 'All Diseases' },
    { value: 'covid-19', label: 'COVID-19' },
    { value: 'influenza', label: 'Influenza' },
    { value: 'dengue', label: 'Dengue' },
    { value: 'malaria', label: 'Malaria' },
    { value: 'tuberculosis', label: 'Tuberculosis' },
    { value: 'diabetes', label: 'Diabetes' },
    { value: 'hypertension', label: 'Hypertension' }
  ];

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
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search regions or countries..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* View Toggle */}
              <div className="flex space-x-2">
                <Button 
                  variant={viewMode === 'heatmap' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('heatmap')}
                >
                  <Globe className="w-4 h-4 mr-1" />
                  Map View
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  List View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Heatmap */}
        {viewMode === 'heatmap' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Disease Distribution Heatmap</span>
              </CardTitle>
              <p className="text-sm text-gray-600">
                Click on regions to view detailed health data
              </p>
            </CardHeader>
            <CardContent>
              <Interactive3DGlobe />
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

        {/* Regional Data List */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Health Data</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="flex space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : healthData && healthData.length > 0 ? (
              <div className="space-y-4">
                {healthData
                  .filter(region => 
                    !searchQuery || 
                    region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    region.country.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((region) => (
                    <Card 
                      key={region.id} 
                      className={`border cursor-pointer transition-all ${
                        selectedRegion?.id === region.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedRegion(region)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{region.name}</h3>
                            <p className="text-sm text-gray-600">{region.country}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getRiskColor(region.riskLevel)}>
                              {region.riskLevel} risk
                            </Badge>
                            <p className="text-sm text-gray-500 mt-1">
                              {region.totalCases.toLocaleString()} cases
                            </p>
                          </div>
                        </div>

                        {/* Top Diseases */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Top Diseases:</h4>
                          <div className="flex flex-wrap gap-2">
                            {region.diseases.slice(0, 3).map((disease, idx) => (
                              <div key={idx} className="flex items-center space-x-1 text-xs bg-gray-100 px-2 py-1 rounded">
                                {getTrendIcon(disease.trend)}
                                <span>{disease.disease}</span>
                                <span className="text-gray-500">({disease.cases.toLocaleString()})</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-3">
                          Last updated: {new Date(region.lastUpdated).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No health data available</p>
                <p className="text-sm text-gray-400">Try adjusting your filters</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Region Details */}
        {selectedRegion && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>{selectedRegion.name}, {selectedRegion.country}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xl font-bold text-blue-600">
                    {selectedRegion.totalCases.toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-700">Total Cases</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xl font-bold text-gray-600">
                    {selectedRegion.population.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-700">Population</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Disease Breakdown:</h4>
                <div className="space-y-3">
                  {selectedRegion.diseases.map((disease, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTrendIcon(disease.trend)}
                        <div>
                          <p className="font-medium text-sm">{disease.disease}</p>
                          <p className="text-xs text-gray-600">{disease.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{disease.cases.toLocaleString()}</p>
                        <Badge className={`text-xs ${getRiskColor(disease.severity)}`}>
                          {disease.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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