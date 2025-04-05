import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AlertTriangle, ShieldCheck, Search, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const StatusSummary = () => {
  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ['/api/incidents'],
  });
  
  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['/api/resources'],
  });
  
  if (incidentsLoading || resourcesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-lg">
            <CardContent className="p-5">
              <div className="h-16 animate-pulse bg-slate-200 dark:bg-slate-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  // Count active critical incidents
  const criticalIncidents = incidents?.filter(
    (incident: any) => incident.severity === 'critical' && incident.status === 'active'
  ).length || 0;
  
  // Count resources under investigation
  const investigatedResources = resources?.filter(
    (resource: any) => resource.status.toLowerCase().includes('compromised') || 
                        resource.status.toLowerCase().includes('exfiltration') || 
                        resource.status.toLowerCase().includes('escalation')
  ).length || 0;
  
  // Count secured resources
  const securedResources = resources?.filter(
    (resource: any) => resource.status.toLowerCase() === 'normal'
  ).length || 0;
  
  // Count pending tasks (a mock number for demonstration)
  const pendingTasks = 12;
  
  const summaryItems = [
    {
      title: "Active Critical Incidents",
      value: criticalIncidents,
      icon: <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-200" />,
      bgColor: "bg-red-100 dark:bg-red-900",
      link: "/incidents?severity=critical"
    },
    {
      title: "Resources Under Investigation",
      value: investigatedResources,
      icon: <Search className="h-6 w-6 text-yellow-600 dark:text-yellow-200" />,
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
      link: "/resources?status=compromised"
    },
    {
      title: "Secured Resources",
      value: securedResources,
      icon: <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-200" />,
      bgColor: "bg-green-100 dark:bg-green-900",
      link: "/resources?status=normal"
    },
    {
      title: "Pending Tasks",
      value: pendingTasks,
      icon: <ClipboardList className="h-6 w-6 text-blue-600 dark:text-blue-200" />,
      bgColor: "bg-blue-100 dark:bg-blue-900",
      link: "/tasks"
    },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {summaryItems.map((item, index) => (
        <Card key={index} className="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-lg">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${item.bgColor}`}>
                {item.icon}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{item.title}</dt>
                  <dd>
                    <div className="text-lg font-medium text-slate-900 dark:text-white">{item.value}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <div className="bg-slate-50 dark:bg-slate-700 px-5 py-3">
            <div className="text-sm">
              <Link href={item.link} className="font-medium text-secondary hover:text-blue-600 dark:hover:text-blue-400">
                View all
              </Link>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
