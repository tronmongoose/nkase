import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ResourceCard } from "@/components/dashboard/ResourceCard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Filter, 
  Shield, 
  X, 
  Download, 
  Server,
  Database,
  Users,
  FileCode,
  HardDrive
} from "lucide-react";
import type { Resource, ResourceFilters } from "@/types";

const Resources = () => {
  const { toast } = useToast();
  const [filters, setFilters] = useState<ResourceFilters>({
    resourceType: "All resources",
    region: "All regions",
    status: ""
  });
  
  // Fetch resources with filters
  const { data: resources, isLoading } = useQuery({
    queryKey: ['/api/resources', filters],
  });
  
  // Handle filter changes
  const handleResourceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({
      ...filters,
      resourceType: e.target.value
    });
  };
  
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({
      ...filters,
      region: e.target.value
    });
  };
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({
      ...filters,
      status: e.target.value
    });
  };
  
  const resetFilters = () => {
    setFilters({
      resourceType: "All resources",
      region: "All regions",
      status: ""
    });
  };
  
  // Group resources by type for summary
  const resourceTypes = resources ? 
    resources.reduce((acc: Record<string, number>, resource: Resource) => {
      acc[resource.resourceType] = (acc[resource.resourceType] || 0) + 1;
      return acc;
    }, {}) : {};
  
  // Count resources by status
  const countByStatus = (status: string) => {
    return resources ? resources.filter((r: Resource) => 
      r.status.toLowerCase().includes(status.toLowerCase())
    ).length : 0;
  };
  
  // Get icon by resource type
  const getResourceTypeIcon = (type: string) => {
    switch(type) {
      case 'EC2':
        return <Server className="h-5 w-5" />;
      case 'S3':
        return <Database className="h-5 w-5" />;
      case 'IAM':
        return <Users className="h-5 w-5" />;
      case 'Lambda':
        return <FileCode className="h-5 w-5" />;
      default:
        return <HardDrive className="h-5 w-5" />;
    }
  };

  // Handle batch actions  
  const isolateSelectedResources = () => {
    toast({
      title: "Batch Action",
      description: "Isolation action would be performed on selected resources",
    });
  };
  
  const createForensicCopies = () => {
    toast({
      title: "Batch Action",
      description: "Forensic copies would be created for selected resources",
    });
  };
  
  const exportResourcesList = () => {
    toast({
      title: "Export Resources",
      description: "Resources list exported to CSV",
    });
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 md:mb-0">AWS Resources</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={isolateSelectedResources}>
              <Shield className="h-4 w-4 mr-2" />
              Isolate Selected
            </Button>
            <Button variant="outline" size="sm" onClick={createForensicCopies}>
              <FileText className="h-4 w-4 mr-2" />
              Create Forensic Copies
            </Button>
            <Button variant="outline" size="sm" onClick={exportResourcesList}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Resource summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Resources</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{resources?.length || 0}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <HardDrive className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Compromised</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{countByStatus('Compromised')}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <X className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Isolated</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {resources?.filter((r: Resource) => r.isolated).length || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Forensic Copies</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {resources?.filter((r: Resource) => r.forensicCopy).length || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters section */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Filter Resources</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8">
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Resource Type
                </label>
                <select 
                  className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  value={filters.resourceType}
                  onChange={handleResourceTypeChange}
                >
                  <option>All resources</option>
                  <option>EC2</option>
                  <option>S3</option>
                  <option>Lambda</option>
                  <option>IAM</option>
                  <option>VPC</option>
                  <option>RDS</option>
                  <option>CloudTrail</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Region
                </label>
                <select 
                  className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  value={filters.region}
                  onChange={handleRegionChange}
                >
                  <option>All regions</option>
                  <option>us-east-1</option>
                  <option>us-west-2</option>
                  <option>eu-central-1</option>
                  <option>ap-southeast-1</option>
                  <option>global</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select 
                  className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  value={filters.status}
                  onChange={handleStatusChange}
                >
                  <option value="">All statuses</option>
                  <option value="Compromised">Compromised</option>
                  <option value="Data Exfiltration">Data Exfiltration</option>
                  <option value="Privilege Escalation">Privilege Escalation</option>
                  <option value="Modified Code">Modified Code</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Resources list */}
        <div className="mt-6">
          <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Resources</h2>
          
          {/* Resource type summary */}
          <div className="mb-6 flex flex-wrap gap-2">
            {Object.entries(resourceTypes).map(([type, count]) => (
              <div key={type} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                {getResourceTypeIcon(type)}
                <span className="ml-2">{type}: {count}</span>
              </div>
            ))}
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : resources && resources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((resource: Resource) => (
                <ResourceCard
                  key={resource.id}
                  id={resource.id}
                  resourceId={resource.resourceId}
                  resourceType={resource.resourceType}
                  name={resource.name}
                  region={resource.region}
                  status={resource.status}
                  discoveredAt={resource.discoveredAt}
                  metadata={resource.metadata}
                  isolated={resource.isolated}
                  forensicCopy={resource.forensicCopy}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
              <Filter className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-medium text-slate-900 dark:text-white">No resources found</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Try adjusting your filters or add new resources.
              </p>
              <Button variant="outline" className="mt-4" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Resources;
