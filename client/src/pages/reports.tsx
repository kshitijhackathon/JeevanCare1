import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Thermometer,
  Weight,
  Eye,
  BarChart3,
  LineChart,
  PieChart,
  Filter,
  Share,
  Printer
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface HealthReport {
  id: number;
  type: string;
  title: string;
  date: string;
  status: 'normal' | 'warning' | 'critical';
  category: 'lab' | 'scan' | 'consultation' | 'vitals';
  keyFindings: string[];
  recommendations: string[];
  downloadUrl?: string;
  aiInsights?: string;
}

interface HealthMetric {
  name: string;
  value: string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'normal' | 'warning' | 'critical';
  history: { date: string; value: number }[];
}

export default function Reports() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState('3months');

  // Fetch health reports
  const { data: reports, isLoading: reportsLoading } = useQuery<HealthReport[]>({
    queryKey: ['/api/health-reports', selectedCategory, dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/health-reports?category=${selectedCategory}&range=${dateRange}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    }
  });

  // Fetch health metrics
  const { data: metrics } = useQuery<HealthMetric[]>({
    queryKey: ['/api/health-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/health-metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    }
  });

  const categories = [
    { value: 'all', label: 'All Reports', icon: FileText },
    { value: 'lab', label: 'Lab Tests', icon: Activity },
    { value: 'scan', label: 'Scans/Imaging', icon: Eye },
    { value: 'consultation', label: 'Consultations', icon: Heart },
    { value: 'vitals', label: 'Vital Signs', icon: Thermometer }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'normal': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string, status: string) => {
    const colorClass = status === 'critical' ? 'text-red-500' : 
                      status === 'warning' ? 'text-yellow-500' : 'text-green-500';

    switch (trend) {
      case 'up': return <TrendingUp className={`w-4 h-4 ${colorClass}`} />;
      case 'down': return <TrendingDown className={`w-4 h-4 ${colorClass}`} />;
      default: return <Activity className={`w-4 h-4 ${colorClass}`} />;
    }
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
          <h1 className="text-xl font-semibold">Health Reports</h1>
          <div className="ml-auto flex space-x-2">
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Health Overview Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">72</p>
              <p className="text-sm text-gray-600">Heart Rate</p>
              <p className="text-xs text-green-600">Normal</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Thermometer className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">98.6°F</p>
              <p className="text-sm text-gray-600">Temperature</p>
              <p className="text-xs text-green-600">Normal</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Weight className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">65 kg</p>
              <p className="text-sm text-gray-600">Weight</p>
              <p className="text-xs text-green-600">Stable</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">120/80</p>
              <p className="text-sm text-gray-600">Blood Pressure</p>
              <p className="text-xs text-green-600">Optimal</p>
            </CardContent>
          </Card>
        </div>

        {/* Health Metrics Trends */}
        {metrics && metrics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LineChart className="w-5 h-5" />
                <span>Health Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.slice(0, 4).map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getTrendIcon(metric.trend, metric.status)}
                      <div>
                        <p className="font-medium text-sm">{metric.name}</p>
                        <p className="text-xs text-gray-600">Last 7 days</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{metric.value} {metric.unit}</p>
                      <Badge className={`text-xs ${getStatusColor(metric.status)}`}>
                        {metric.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Report Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map(category => (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`p-2 text-xs rounded-lg border transition-colors ${
                        selectedCategory === category.value
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <category.icon className="w-4 h-4 mx-auto mb-1" />
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Time Period</label>
                <select 
                  className="w-full p-2 border rounded-lg text-sm"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="1week">Last Week</option>
                  <option value="1month">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="1year">Last Year</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Reports</span>
              <Badge variant="outline">{reports?.length || 0} reports</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
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
            ) : reports && reports.length > 0 ? (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card key={report.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-medium text-sm">{report.title}</h3>
                              <p className="text-xs text-gray-500">
                                {new Date(report.date).toLocaleDateString()} • {report.type}
                              </p>
                            </div>
                            <Badge className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                          </div>

                          {/* Key Findings */}
                          {report.keyFindings.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-700 mb-1">Key Findings:</p>
                              <div className="space-y-1">
                                {report.keyFindings.map((finding, idx) => (
                                  <p key={idx} className="text-xs text-gray-600 flex items-start">
                                    <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                    {finding}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AI Insights */}
                          {report.aiInsights && (
                            <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                              <p className="text-xs font-medium text-blue-900 mb-1">🤖 AI Insights:</p>
                              <p className="text-xs text-blue-800">{report.aiInsights}</p>
                            </div>
                          )}

                          {/* Recommendations */}
                          {report.recommendations.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-700 mb-1">Recommendations:</p>
                              <div className="space-y-1">
                                {report.recommendations.slice(0, 2).map((rec, idx) => (
                                  <p key={idx} className="text-xs text-green-700 flex items-start">
                                    <span className="w-1 h-1 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                    {rec}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex space-x-2 pt-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            {report.downloadUrl && (
                              <Button size="sm" variant="outline">
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Share className="w-4 h-4 mr-1" />
                              Share
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No reports found</p>
                <p className="text-sm text-gray-400">
                  {selectedCategory === 'all' 
                    ? 'Upload medical records or complete consultations to see reports here'
                    : `No ${selectedCategory} reports in the selected time period`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/medical-records">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Upload Records
                </Button>
              </Link>
              <Link href="/book-test">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Test
                </Button>
              </Link>
              <Link href="/ai-consultation">
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  AI Analysis
                </Button>
              </Link>
              <Link href="/doctor-escalation">
                <Button variant="outline" className="w-full justify-start">
                  <Heart className="w-4 h-4 mr-2" />
                  Find Doctor
                </Button>
              </Link>
            </div>
          ```typescript
          </CardContent>
        </Card>
      </div>
    </div>
  );
}