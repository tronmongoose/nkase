import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface IncidentCardProps {
  id: number;
  incidentId: string;
  title: string;
  severity: string;
  detectedAt: string;
  resourceName: string;
  resourceId: string;
  region: string;
}

export const IncidentCard = ({
  id,
  incidentId,
  title,
  severity,
  detectedAt,
  resourceName,
  resourceId,
  region
}: IncidentCardProps) => {
  const { toast } = useToast();
  
  // Format the time string
  const timeAgo = formatDistanceToNow(new Date(detectedAt), { addSuffix: true });
  
  // Get the severity color
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return {
          dot: 'bg-red-500',
          badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        };
      case 'high':
        return {
          dot: 'bg-yellow-500',
          badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        };
      case 'medium':
        return {
          dot: 'bg-orange-500',
          badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
        };
      case 'low':
      default:
        return {
          dot: 'bg-blue-500',
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        };
    }
  };
  
  const severityColor = getSeverityColor(severity);
  
  // Actions
  const createForensicCopy = async () => {
    try {
      // Find the resource id from the incident's affected resources
      const resourceId = await apiRequest('POST', `/api/resources/${resourceId}/forensic-copy`);
      toast({
        title: "Forensic Copy Created",
        description: `A forensic copy has been created for resource ${resourceName}`,
      });
      
      // Invalidate resources to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create forensic copy",
        variant: "destructive",
      });
    }
  };
  
  const isolateInstance = async () => {
    try {
      await apiRequest('POST', `/api/resources/${resourceId}/isolate`);
      toast({
        title: "Resource Isolated",
        description: `${resourceName} has been successfully isolated`,
      });
      
      // Invalidate resources to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to isolate the resource",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="px-4 py-4 sm:px-6 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
      <Link href={`/incidents/${id}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className={`h-4 w-4 rounded-full ${severityColor.dot}`}></span>
            <p className="ml-2 text-sm font-medium text-slate-900 dark:text-white">{title}</p>
            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${severityColor.badge}`}>
              {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </span>
          </div>
          <div className="flex items-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">{timeAgo}</p>
            <ChevronRight className="ml-2 h-5 w-5 text-slate-400" />
          </div>
        </div>
      </Link>
      <div className="mt-2 flex justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Instance: <span className="font-medium text-slate-700 dark:text-slate-300">{resourceId}</span>
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Region: <span className="font-medium text-slate-700 dark:text-slate-300">{region}</span>
          </p>
        </div>
        <div className="flex items-center">
          <button 
            className="inline-flex items-center px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 shadow-sm text-xs font-medium rounded text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none"
            onClick={(e) => {
              e.preventDefault(); // Prevent navigation
              createForensicCopy();
            }}
          >
            Forensic copy
          </button>
          <button 
            className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-red-300 dark:border-red-700 shadow-sm text-xs font-medium rounded text-red-700 dark:text-red-200 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900 focus:outline-none"
            onClick={(e) => {
              e.preventDefault(); // Prevent navigation
              isolateInstance();
            }}
          >
            Isolate
          </button>
        </div>
      </div>
    </div>
  );
};
