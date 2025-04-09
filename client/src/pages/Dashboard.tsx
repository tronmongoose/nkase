import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { StatusSummary } from "@/components/dashboard/StatusSummary";
import { IncidentCard } from "@/components/dashboard/IncidentCard";
import { ResourceCard } from "@/components/dashboard/ResourceCard";
import { Timeline } from "@/components/dashboard/Timeline";
import { ActionPanel } from "@/components/dashboard/ActionPanel";
import { MoreHorizontal, ClipboardList } from "lucide-react";

const Dashboard = () => {
  const { user, roleName } = useAuth();
  const [incidentFilters, setIncidentFilters] = useState({
    severity: "All severities",
    timeframe: "Last 24 hours"
  });
  const [resourceFilters, setResourceFilters] = useState({
    resourceType: "All resources",
    region: "All regions"
  });
  
  // Fetch incidents
  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ['/api/incidents', incidentFilters],
  });
  
  // Fetch resources
  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['/api/resources', resourceFilters],
  });
  
  // Fetch timeline events for the first incident (if exists)
  const { data: timelineEvents, isLoading: timelineLoading } = useQuery({
    queryKey: ['/api/incidents/1/timeline'],
    enabled: incidents && incidents.length > 0,
  });
  
  // Handling incident filter changes
  const handleIncidentSeverityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIncidentFilters({
      ...incidentFilters,
      severity: e.target.value
    });
  };
  
  const handleIncidentTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIncidentFilters({
      ...incidentFilters,
      timeframe: e.target.value
    });
  };
  
  // Handling resource filter changes
  const handleResourceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setResourceFilters({
      ...resourceFilters,
      resourceType: e.target.value
    });
  };
  
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setResourceFilters({
      ...resourceFilters,
      region: e.target.value
    });
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Current Incident View</h1>
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none">
              <MoreHorizontal className="h-4 w-4 mr-2" />
              Actions
            </button>
            <button className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-secondary hover:bg-blue-600 focus:outline-none">
              <ClipboardList className="h-4 w-4 mr-2" />
              Create Report
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Status Summary Cards */}
        <StatusSummary />
        
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Active Incidents Panel */}
            <div className="bg-white dark:bg-slate-800 shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">Active Incidents</h3>
                <div className="flex space-x-2">
                  <select 
                    className="mt-1 block text-sm pl-3 pr-10 py-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-md border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={incidentFilters.severity}
                    onChange={handleIncidentSeverityChange}
                  >
                    <option>All severities</option>
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                  <select 
                    className="mt-1 block text-sm pl-3 pr-10 py-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-md border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={incidentFilters.timeframe}
                    onChange={handleIncidentTimeframeChange}
                  >
                    <option>Last 24 hours</option>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>All time</option>
                  </select>
                </div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700">
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {incidentsLoading ? (
                    <div className="p-4">
                      <div className="animate-pulse space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        ))}
                      </div>
                    </div>
                  ) : incidents && incidents.length > 0 ? (
                    incidents.map((incident: any) => {
                      // Find the first resource associated with this incident
                      const resource = resources?.find((r: any) => 
                        incident.affectedResources.includes(r.resourceId)
                      );
                      
                      return (
                        <IncidentCard
                          key={incident.id}
                          id={incident.id}
                          incidentId={incident.incidentId}
                          title={incident.title}
                          severity={incident.severity}
                          detectedAt={incident.detectedAt}
                          resourceName={resource?.name || "Unknown"}
                          resourceId={resource?.resourceId || "Unknown"}
                          region={resource?.region || "Unknown"}
                        />
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                      No active incidents found
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-4 sm:px-6 text-center">
                <button className="text-sm font-medium text-secondary hover:text-blue-600 dark:hover:text-blue-400">
                  View all incidents
                </button>
              </div>
            </div>
            
            {/* Resources Panel */}
            <div className="bg-white dark:bg-slate-800 shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">NKASE Protected Resources</h3>
                <div className="flex space-x-2">
                  <select 
                    className="mt-1 block text-sm pl-3 pr-10 py-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-md border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={resourceFilters.resourceType}
                    onChange={handleResourceTypeChange}
                  >
                    <option>All resources</option>
                    <option>EC2</option>
                    <option>S3</option>
                    <option>Lambda</option>
                    <option>IAM</option>
                  </select>
                  <select 
                    className="mt-1 block text-sm pl-3 pr-10 py-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-md border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={resourceFilters.region}
                    onChange={handleRegionChange}
                  >
                    <option>All regions</option>
                    <option>us-east-1</option>
                    <option>us-west-2</option>
                    <option>eu-central-1</option>
                    <option>ap-southeast-1</option>
                  </select>
                </div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resourcesLoading ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                    ))
                  ) : resources && resources.length > 0 ? (
                    resources.map((resource: any) => (
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
                    ))
                  ) : (
                    <div className="col-span-2 text-center text-slate-500 dark:text-slate-400 py-8">
                      No affected resources found
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-4 sm:px-6 text-center">
                <button className="text-sm font-medium text-secondary hover:text-blue-600 dark:hover:text-blue-400">
                  View all resources
                </button>
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-4">
            {/* Incident Details Panel */}
            {incidents && incidents.length > 0 && (
              <div className="bg-white dark:bg-slate-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">Incident Details</h3>
                  <div>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      incidents[0].severity === 'critical' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : incidents[0].severity === 'high'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {incidents[0].severity.charAt(0).toUpperCase() + incidents[0].severity.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="border-t border-b border-slate-200 dark:border-slate-700 p-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                    <div>
                      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Incident ID</dt>
                      <dd className="mt-1 text-sm text-slate-900 dark:text-white">{incidents[0].incidentId}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Title</dt>
                      <dd className="mt-1 text-sm text-slate-900 dark:text-white">{incidents[0].title}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Affected Resources</dt>
                      <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                        {incidents[0].affectedResources.map((resourceId: string, idx: number) => (
                          <span key={idx} className="block">{resourceId}</span>
                        ))}
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
                      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</dt>
                      <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Under Investigation
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">First Detected</dt>
                      <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                        {new Date(incidents[0].detectedAt).toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Last Updated</dt>
                      <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                        {new Date(incidents[0].updatedAt).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="px-4 py-4 sm:px-6">
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Description</h4>
                  <p className="text-sm text-slate-900 dark:text-white">
                    {incidents[0].description}
                  </p>
                  <div className="mt-4 flex justify-end space-x-3">
                    <button className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none">
                      Edit
                    </button>
                    <button className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-secondary hover:bg-blue-600 focus:outline-none">
                      View Full Details
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Timeline Panel */}
            {incidents && incidents.length > 0 && (
              <div className="bg-white dark:bg-slate-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">Attack Timeline</h3>
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
                <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-4 sm:px-6 flex justify-end">
                  <button className="text-sm font-medium text-secondary hover:text-blue-600 dark:hover:text-blue-400">
                    View detailed timeline
                  </button>
                </div>
              </div>
            )}
            
            {/* Action Panel */}
            {incidents && incidents.length > 0 && resources && resources.length > 0 && (
              <ActionPanel 
                incidentId={incidents[0].id} 
                resourceId={resources[0].id} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
