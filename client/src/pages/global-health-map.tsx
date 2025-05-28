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

  // Mock world map component (in production, use react-simple-maps or similar)
  const WorldMapHeatmap = () => (
    <div className="relative bg-gray-100 rounded-lg h-64 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Globe className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-sm text-gray-600 mb-2">Global Disease Heatmap</p>
          <p className="text-xs text-gray-500">Interactive world map showing disease distribution</p>
        </div>
      </div>
      
      {/* Sample heatmap regions */}
      <div className="absolute top-8 left-12 w-6 h-4 bg-red-500 rounded opacity-80 cursor-pointer hover:opacity-100"
           onClick={() => setSelectedRegion(healthData?.[0] || null)}
           title="North America - High Alert"></div>
      <div className="absolute top-16 right-16 w-8 h-6 bg-yellow-500 rounded opacity-80 cursor-pointer hover:opacity-100"
           onClick={() => setSelectedRegion(healthData?.[1] || null)}
           title="Asia - Medium Risk"></div>
      <div className="absolute bottom-12 left-20 w-5 h-4 bg-green-500 rounded opacity-80 cursor-pointer hover:opacity-100"
           onClick={() => setSelectedRegion(healthData?.[2] || null)}
           title="Europe - Low Risk"></div>
      <div className="absolute bottom-8 right-12 w-4 h-3 bg-orange-500 rounded opacity-80 cursor-pointer hover:opacity-100"
           onClick={() => setSelectedRegion(healthData?.[3] || null)}
           title="Australia - Medium Risk"></div>
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 p-2 rounded text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>High</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Critical</span>
          </div>
        </div>
      </div>
    </div>
  );

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
              <WorldMapHeatmap />
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