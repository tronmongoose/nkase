import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Timeline } from "@/components/dashboard/Timeline";
import { ActionPanel } from "@/components/dashboard/ActionPanel";
import { SeverityPredictor } from "@/components/incidents/SeverityPredictor";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Pencil, ChevronLeft, AlertTriangle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Incident, Resource, TimelineEvent } from "@/types";

const IncidentDetails = () => {
  const params = useParams();
  const id = params.id || '';
  const { user } = useAuth();
  const incidentId = parseInt(id);
  
  // Fetch incident details
  const { data: incident, isLoading: incidentLoading } = useQuery<Incident>({
    queryKey: [`/api/incidents/${incidentId}`],
    enabled: !isNaN(incidentId),
  });
  
  // Fetch resources
  const { data: resources, isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ['/api/resources'],
    enabled: !!incident,
  });
  
  // Fetch timeline events
  const { data: timelineEvents, isLoading: timelineLoading } = useQuery<TimelineEvent[]>({
    queryKey: [`/api/incidents/${incidentId}/timeline`],
    enabled: !isNaN(incidentId),
  });
  
  // Filter resources to get only those affected by this incident
  const affectedResources = resources?.filter(
    (resource: any) => incident?.affectedResources.includes(resource.resourceId)
  );
  
  // Function to get severity badge styling
  const getSeverityBadge = (severity: string) => {
    switch(severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };
  
  if (incidentLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!incident) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Incident Not Found</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              The incident you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button variant="default" className="mt-4" asChild>
              <a href="/">Return to Dashboard</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Button variant="ghost" size="sm" asChild>
              <a href="/" className="flex items-center text-slate-600 dark:text-slate-400">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </a>
            </Button>
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{incident.title}</h1>
                <span className={`ml-4 px-2.5 py-0.5 text-xs font-medium rounded-full ${getSeverityBadge(incident.severity)}`}>
                  {incident.severity.toUpperCase()}
                </span>
              </div>
              <div className="mt-1 flex items-center text-sm text-slate-500 dark:text-slate-400">
                <span className="mr-2">{incident.incidentId}</span>
                <span className="mx-2">•</span>
                <Clock className="h-4 w-4 mr-1" />
                <span>Detected {formatDistanceToNow(new Date(incident.detectedAt), { addSuffix: true })}</span>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Incident
              </Button>
              <Button variant="destructive" size="sm">
                Isolate Resources
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - details and affected resources */}
          <div className="lg:col-span-2 space-y-6">
            {/* Incident details */}
            <div className="bg-white dark:bg-slate-800 shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Incident Details</h3>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                  <div className="col-span-1 md:col-span-2">
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Description</dt>
                    <dd className="mt-1 text-sm text-slate-900 dark:text-white">{incident.description}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</dt>
                    <dd className="mt-1">
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Under Investigation
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Severity</dt>
                    <dd className="mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getSeverityBadge(incident.severity)}`}>
                        {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Assigned To</dt>
                    <dd className="mt-1 text-sm text-slate-900 dark:text-white flex items-center">
                      <img className="h-6 w-6 rounded-full" src={user?.avatarUrl} alt="" />
                      <span className="ml-2">{user?.fullName}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">First Detected</dt>
                    <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                      {new Date(incident.detectedAt).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {/* Affected resources */}
            <div className="bg-white dark:bg-slate-800 shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Affected Resources</h3>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {incident.affectedResources.length} resources
                </span>
              </div>
              <div className="p-6">
                {resourcesLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    ))}
                  </div>
                ) : affectedResources && affectedResources.length > 0 ? (
                  <div className="space-y-4">
                    {affectedResources.map((resource: any) => (
                      <div key={resource.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-white">{resource.resourceType}: {resource.name}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{resource.resourceId}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            resource.status.toLowerCase().includes('compromised') 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {resource.status}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div className="text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Region:</span>
                            <span className="ml-1 text-slate-700 dark:text-slate-300">{resource.region}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Isolated:</span>
                            <span className="ml-1 text-slate-700 dark:text-slate-300">
                              {resource.isolated ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <Button variant="outline" size="sm">Investigate</Button>
                          <Button variant="destructive" size="sm" disabled={resource.isolated}>
                            {resource.isolated ? 'Isolated' : 'Isolate'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                    No affected resources found
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right column - timeline, AI risk analysis, and actions */}
          <div className="space-y-6">
            {/* AI Risk Analysis */}
            <SeverityPredictor 
              incidentId={incident.id}
            />

            {/* Timeline panel */}
            <div className="bg-white dark:bg-slate-800 shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Attack Timeline</h3>
              </div>
              {timelineLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : timelineEvents && timelineEvents.length > 0 ? (
                <Timeline events={timelineEvents} />
              ) : (
                <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                  No timeline events available
                </div>
              )}
            </div>
            
            {/* Action panel */}
            {affectedResources && affectedResources.length > 0 && (
              <ActionPanel 
                incidentId={incident.id} 
                resourceId={affectedResources[0].id} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetails;
