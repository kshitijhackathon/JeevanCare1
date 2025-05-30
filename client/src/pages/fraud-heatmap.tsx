import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

// Sample fraud data by state
const fraudData = [
  { state: 'Maharashtra', reports: 120, type: 'Fake Products' },
  { state: 'Karnataka', reports: 85, type: 'Phishing' },
  { state: 'Delhi', reports: 150, type: 'Fraud' },
  { state: 'Uttar Pradesh', reports: 110, type: 'Impersonation' },
  { state: 'Tamil Nadu', reports: 95, type: 'Fake Products' },
  { state: 'Gujarat', reports: 75, type: 'Phishing' },
  { state: 'West Bengal', reports: 68, type: 'Impersonation' },
  { state: 'Telangana', reports: 55, type: 'Fraud' },
  { state: 'Rajasthan', reports: 48, type: 'Phishing' },
  { state: 'Bihar', reports: 38, type: 'Impersonation' },
  { state: 'Madhya Pradesh', reports: 42, type: 'Fake Products' },
  { state: 'Kerala', reports: 35, type: 'Fraud' },
  { state: 'Punjab', reports: 30, type: 'Phishing' },
  { state: 'Haryana', reports: 32, type: 'Impersonation' },
  { state: 'Andhra Pradesh', reports: 45, type: 'Fake Products' },
];

// Scam hotspot markers
const scamHotspots = [
  { name: "Mumbai", reports: 89 },
  { name: "Delhi", reports: 132 },
  { name: "Bengaluru", reports: 65 },
  { name: "Chennai", reports: 58 },
  { name: "Hyderabad", reports: 46 },
  { name: "Kolkata", reports: 53 },
];

// Type filter options
const scamTypes = ['All Types', 'Fake Products', 'Phishing', 'Impersonation', 'Fraud'];

// Time period filter options
const timePeriods = ['Last Week', 'Last Month', 'Last 3 Months', 'Last Year', 'All Time'];

export default function FraudHeatmap() {
  // State
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  // Globe rotation animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + (isHovering ? 0.2 : 0.8)) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [isHovering]);
  
  // Filter data based on selected type
  const filteredData = selectedType === 'All Types'
    ? fraudData
    : fraudData.filter(item => item.type === selectedType);
  
  // Get data for a selected region
  const selectedRegionData = selectedRegion 
    ? fraudData.find(item => item.state === selectedRegion)
    : null;

  // Colors for the risk levels
  const riskColors = {
    low: '#C5E8FF',
    medium: '#89CFF0',
    high: '#5D9BF0',
    veryHigh: '#3573D9'
  };

  // Function to get risk color based on reports
  const getRiskColor = (reports: number): string => {
    if (reports <= 50) return riskColors.low;
    if (reports <= 100) return riskColors.medium; 
    if (reports <= 150) return riskColors.high;
    return riskColors.veryHigh;
  };

  // Professional 3D Globe Component
  const Professional3DGlobe = () => {
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

            {/* Fraud Hotspots */}
            {filteredData.slice(0, 8).map((region, index) => {
              const angle = (index * 45 + rotation) % 360;
              const radius = 35;
              const x = 50 + radius * Math.cos(angle * Math.PI / 180);
              const y = 50 + radius * Math.sin(angle * Math.PI / 180);
              const depth = Math.cos(angle * Math.PI / 180);
              const isVisible = depth > -0.5;
              const scale = Math.max(0.3, (depth + 1) / 2);
              
              const getHotspotColor = (reports: number) => {
                if (reports > 100) return 'bg-red-500 shadow-red-500/50';
                if (reports > 75) return 'bg-orange-500 shadow-orange-500/50';
                if (reports > 50) return 'bg-yellow-500 shadow-yellow-500/50';
                return 'bg-green-500 shadow-green-500/50';
              };
              
              if (!isVisible) return null;
              
              return (
                <div
                  key={region.state}
                  className={`absolute w-3 h-3 rounded-full ${getHotspotColor(region.reports)} animate-ping cursor-pointer transform-gpu`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    opacity: scale * 0.9,
                    zIndex: Math.floor(scale * 10),
                    boxShadow: `0 0 20px ${region.reports > 100 ? '#ef4444' : 
                                            region.reports > 75 ? '#f97316' :
                                            region.reports > 50 ? '#eab308' : '#22c55e'}`
                  }}
                  onClick={() => setSelectedRegion(region.state)}
                  title={`${region.state}: ${region.reports} fraud reports (${region.type})`}
                />
              );
            })}

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
          </div>

          {/* Globe Info Display */}
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur text-white p-3 rounded-lg">
            <h3 className="font-bold text-sm">🚨 Fraud Monitor</h3>
            <p className="text-xs opacity-80">Live Fraud Tracking</p>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-xs">Active Monitoring</span>
            </div>
          </div>

          {/* Risk Level Legend */}
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur text-white p-3 rounded-lg">
            <h4 className="text-xs font-semibold mb-2">Risk Levels</h4>
            <div className="space-y-1">
              {[
                { level: 'Critical', color: 'bg-red-500', count: filteredData.filter(r => r.reports > 100).length },
                { level: 'High', color: 'bg-orange-500', count: filteredData.filter(r => r.reports > 75 && r.reports <= 100).length },
                { level: 'Medium', color: 'bg-yellow-500', count: filteredData.filter(r => r.reports > 50 && r.reports <= 75).length },
                { level: 'Low', color: 'bg-green-500', count: filteredData.filter(r => r.reports <= 50).length }
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
          <h1 className="text-xl font-semibold">Fraud Heatmap</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <p className="text-gray-600">
          Visualize scam-prone regions across India and identify high-risk areas
        </p>
        
        {/* Filters */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Scam Type</label>
              <Select
                value={selectedType}
                onValueChange={setSelectedType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {scamTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Time Period</label>
              <Select
                value={selectedPeriod}
                onValueChange={setSelectedPeriod}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {timePeriods.map(period => (
                    <SelectItem key={period} value={period}>{period}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Map and stats tabs */}
        <Tabs defaultValue="map">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="map">3D Globe</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="map" className="pt-4">
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-medium mb-4">Interactive 3D Fraud Globe</h3>
                <Professional3DGlobe />
                
                {selectedRegion && selectedRegionData && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-red-900">{selectedRegion} Fraud Data</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Total Reports: {selectedRegionData.reports} | 
                      Primary Type: {selectedRegionData.type} | 
                      Risk Level: <span className="font-medium">
                        {selectedRegionData.reports > 100 ? 'CRITICAL' :
                         selectedRegionData.reports > 75 ? 'HIGH' :
                         selectedRegionData.reports > 50 ? 'MEDIUM' : 'LOW'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="stats" className="pt-4">
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium mb-3">Top 5 Fraud-Prone Regions</h3>
                <div className="space-y-3">
                  {[...filteredData]
                    .sort((a, b) => b.reports - a.reports)
                    .slice(0, 5)
                    .map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs mr-2">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{item.state}</span>
                            <span>{item.reports} reports</span>
                          </div>
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ 
                                width: `${(item.reports / 150) * 100}%`,
                                backgroundColor: getRiskColor(item.reports)
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-medium mb-2">By Scam Type</h3>
                  <div className="space-y-2">
                    {['Fake Products', 'Phishing', 'Impersonation', 'Fraud'].map(type => {
                      const count = fraudData
                        .filter(item => item.type === type)
                        .reduce((sum, item) => sum + item.reports, 0);
                      return (
                        <div key={type} className="flex justify-between items-center">
                          <span className="text-sm">{type}</span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
                
                <Card className="p-4">
                  <h3 className="font-medium mb-2">Total Reports</h3>
                  <div className="text-3xl font-bold mb-2 text-red-600">
                    {filteredData.reduce((sum, item) => sum + item.reports, 0)}
                  </div>
                  <div className="text-sm text-gray-500">
                    For {selectedPeriod.toLowerCase()} {selectedType !== 'All Types' ? `(${selectedType})` : ''}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Fraud Insights */}
        <Card>
          <div className="p-4">
            <h3 className="font-medium mb-3">Fraud Insights</h3>
            <div className="space-y-3 text-sm">
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium text-red-900 mb-1">⚠️ High Alert Areas</p>
                <p className="text-red-800">
                  Delhi and Maharashtra showing increased fraud activity. Enhanced monitoring recommended.
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="font-medium text-yellow-900 mb-1">📈 Trending Scams</p>
                <p className="text-yellow-800">
                  Fake product scams and phishing attempts are on the rise in urban areas.
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-blue-900 mb-1">🛡️ Prevention Tips</p>
                <p className="text-blue-800">
                  Always verify seller credentials and avoid clicking suspicious links or sharing personal information.
                </p>
              </div>
            </div>
          </div>
        </Card>
        
        <p className="text-xs text-gray-500">
          Data updated hourly. The heatmap is generated based on actual user reports and fraud alerts from our database.
        </p>
      </div>
    </div>
  );
}