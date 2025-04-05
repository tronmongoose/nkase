import { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Download, 
  FileText, 
  Calendar, 
  Filter,
  PieChart as PieChartIcon,
  TrendingUp
} from "lucide-react";
import type { Incident, Resource, TimeSeriesDataPoint, SecurityMetric } from "@/types";

// Colors for charts
const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
const SEVERITY_COLORS = {
  critical: '#EF4444', // red-500
  high: '#F59E0B', // amber-500
  medium: '#3B82F6', // blue-500
  low: '#10B981' // emerald-500
};

const Reports = () => {
  const [timeframe, setTimeframe] = useState("7days");
  
  // Fetch incidents
  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ['/api/incidents'],
  });
  
  // Fetch resources
  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['/api/resources'],
  });
  
  // Generate report metrics based on incidents and resources
  const isLoading = incidentsLoading || resourcesLoading;
  
  // Chart data calculations
  const getIncidentsBySeverity = () => {
    if (!incidents) return [];
    
    const counts: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    incidents.forEach((incident: Incident) => {
      counts[incident.severity] = (counts[incident.severity] || 0) + 1;
    });
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };
  
  const getResourcesByType = () => {
    if (!resources) return [];
    
    const counts: Record<string, number> = {};
    
    resources.forEach((resource: Resource) => {
      counts[resource.resourceType] = (counts[resource.resourceType] || 0) + 1;
    });
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };
  
  const getResourcesByStatus = () => {
    if (!resources) return [];
    
    const statusGroups: Record<string, number> = {
      'Compromised': 0,
      'Data Exfiltration': 0,
      'Privilege Escalation': 0,
      'Modified Code': 0,
      'Normal': 0
    };
    
    resources.forEach((resource: Resource) => {
      // Group by main status categories
      for (const key of Object.keys(statusGroups)) {
        if (resource.status.includes(key)) {
          statusGroups[key]++;
          break;
        }
      }
    });
    
    return Object.entries(statusGroups)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  };
  
  // Mock time series data for incident trend
  // In a real app, this would come from the API with actual dates
  const getIncidentTrend = (): TimeSeriesDataPoint[] => {
    const now = new Date();
    const data = [];
    
    // Generate data points based on selected timeframe
    const days = timeframe === '30days' ? 30 : timeframe === '7days' ? 7 : 1;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate a value between 1-10 for demo purposes
      data.push({
        date: dateStr,
        value: Math.floor(Math.random() * 10) + 1
      });
    }
    
    return data;
  };
  
  // Security metrics
  const securityMetrics: SecurityMetric[] = [
    { name: "Mean Time to Detect", value: 84, change: -12, trend: "down" },
    { name: "Mean Time to Respond", value: 168, change: -24, trend: "down" },
    { name: "Resolution Rate", value: 85, change: 5, trend: "up" },
    { name: "Vulnerable Resources", value: 7, change: -3, trend: "down" }
  ];
  
  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
  };
  
  // Handle export
  const handleExport = (format: string) => {
    console.log(`Exporting report as ${format}`);
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 md:mb-0">Security Reports</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
        
        {/* Time period selector */}
        <div className="mt-6">
          <Tabs value={timeframe} onValueChange={handleTimeframeChange}>
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="24hours">Last 24 Hours</TabsTrigger>
                <TabsTrigger value="7days">Last 7 Days</TabsTrigger>
                <TabsTrigger value="30days">Last 30 Days</TabsTrigger>
              </TabsList>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-slate-500" />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {/* Key metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {securityMetrics.map((metric, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.name}</p>
                        <div className="flex items-baseline mt-1">
                          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                            {metric.value}{metric.name.includes("Time") ? "min" : "%"}
                          </p>
                          <p className={`ml-2 text-sm ${metric.trend === 'down' ? 
                              (metric.name.includes("Time") || metric.name.includes("Vulnerable") ? 
                                'text-green-500 dark:text-green-400' : 
                                'text-red-500 dark:text-red-400') : 
                              (metric.name.includes("Time") || metric.name.includes("Vulnerable") ?
                                'text-red-500 dark:text-red-400' : 
                                'text-green-500 dark:text-green-400')
                            }`}>
                            {metric.change > 0 ? '+' : ''}{metric.change}%
                          </p>
                        </div>
                      </div>
                      <div className={`p-2 rounded-full ${metric.trend === 'down' ? 
                          (metric.name.includes("Time") || metric.name.includes("Vulnerable") ? 
                            'bg-green-100 dark:bg-green-900' : 
                            'bg-red-100 dark:bg-red-900') : 
                          (metric.name.includes("Time") || metric.name.includes("Vulnerable") ?
                            'bg-red-100 dark:bg-red-900' : 
                            'bg-green-100 dark:bg-green-900')
                        }`}>
                        <TrendingUp className={`h-5 w-5 ${metric.trend === 'down' ? 
                            (metric.name.includes("Time") || metric.name.includes("Vulnerable") ? 
                              'text-green-500 dark:text-green-400' : 
                              'text-red-500 dark:text-red-400') : 
                            (metric.name.includes("Time") || metric.name.includes("Vulnerable") ?
                              'text-red-500 dark:text-red-400' : 
                              'text-green-500 dark:text-green-400')
                          }`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
              
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Incidents by Severity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChartIcon className="h-5 w-5 mr-2 text-slate-500" />
                    Incidents by Severity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="w-full h-64 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getIncidentsBySeverity()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {getIncidentsBySeverity().map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS] || CHART_COLORS[index % CHART_COLORS.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`${value} incidents`, 'Count']}
                            contentStyle={{ 
                              background: 'var(--background)', 
                              border: '1px solid var(--border)',
                              borderRadius: '0.5rem' 
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Resources by Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-slate-500" />
                    Resources by Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="w-full h-64 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getResourcesByType()} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={80} />
                          <Tooltip 
                            formatter={(value: number) => [`${value} resources`, 'Count']}
                            contentStyle={{ 
                              background: 'var(--background)', 
                              border: '1px solid var(--border)',
                              borderRadius: '0.5rem' 
                            }}
                          />
                          <Bar dataKey="value" fill="var(--chart-1)" barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Resources by Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChartIcon className="h-5 w-5 mr-2 text-slate-500" />
                    Resources by Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="w-full h-64 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getResourcesByStatus()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {getResourcesByStatus().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`${value} resources`, 'Count']}
                            contentStyle={{ 
                              background: 'var(--background)', 
                              border: '1px solid var(--border)',
                              borderRadius: '0.5rem' 
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Incident Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-slate-500" />
                    Incident Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getIncidentTrend()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [`${value} incidents`, 'Count']}
                          contentStyle={{ 
                            background: 'var(--background)', 
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem' 
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="var(--chart-1)" 
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Security Reports */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Security Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                    <FileText className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-slate-900 dark:text-white">No reports generated yet</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Create your first security report to see it here.
                    </p>
                    <Button className="mt-4">
                      Generate New Report
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Reports;
