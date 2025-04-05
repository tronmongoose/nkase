import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Server, 
  Database, 
  Users, 
  FileCode,
  Clock
} from "lucide-react";

interface ResourceCardProps {
  id: number;
  resourceId: string;
  resourceType: string;
  name: string;
  region: string;
  status: string;
  discoveredAt: string;
  metadata: {
    [key: string]: any;
  };
  isolated: boolean;
  forensicCopy: boolean;
}

export const ResourceCard = ({
  id,
  resourceId,
  resourceType,
  name,
  region,
  status,
  discoveredAt,
  metadata,
  isolated,
  forensicCopy
}: ResourceCardProps) => {
  const { toast } = useToast();
  
  // Format the time string
  const timeAgo = formatDistanceToNow(new Date(discoveredAt), { addSuffix: true });
  
  // Get the severity based on status
  const getSeverity = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('compromised') || statusLower.includes('exfiltration')) {
      return {
        level: 'critical',
        badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      };
    } else if (statusLower.includes('escalation')) {
      return {
        level: 'high',
        badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      };
    } else if (statusLower.includes('modified')) {
      return {
        level: 'medium',
        badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      };
    } else {
      return {
        level: 'normal',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      };
    }
  };
  
  const severity = getSeverity(status);
  
  // Get resource type icon
  const getResourceIcon = () => {
    switch (resourceType) {
      case 'EC2':
        return <Server className="h-6 w-6 text-slate-500 dark:text-slate-400" />;
      case 'S3':
        return <Database className="h-6 w-6 text-slate-500 dark:text-slate-400" />;
      case 'IAM':
        return <Users className="h-6 w-6 text-slate-500 dark:text-slate-400" />;
      case 'Lambda':
        return <FileCode className="h-6 w-6 text-slate-500 dark:text-slate-400" />;
      default:
        return <Server className="h-6 w-6 text-slate-500 dark:text-slate-400" />;
    }
  };
  
  // Actions
  const investigateResource = () => {
    toast({
      title: "Investigating Resource",
      description: `Initiated investigation for ${name}`,
    });
  };
  
  const isolateResource = async () => {
    try {
      await apiRequest('POST', `/api/resources/${id}/isolate`);
      toast({
        title: "Resource Isolated",
        description: `${name} has been successfully isolated`,
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
  
  const createForensicCopy = async () => {
    try {
      await apiRequest('POST', `/api/resources/${id}/forensic-copy`);
      toast({
        title: "Forensic Copy Created",
        description: `A forensic copy of ${name} has been created for analysis`,
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
  
  const destroyResource = async () => {
    if (window.confirm(`Are you sure you want to destroy ${name}? This action cannot be undone.`)) {
      try {
        await apiRequest('POST', `/api/resources/${id}/destroy`);
        toast({
          title: "Resource Destroyed",
          description: `${name} has been destroyed and isolated from the network`,
          variant: "destructive",
        });
        
        // Invalidate resources to refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to destroy the resource",
          variant: "destructive",
        });
      }
    }
  };
  
  // Get metadata items for the grid
  const getMetadataItems = () => {
    const items = [];
    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        items.push({
          label: key.charAt(0).toUpperCase() + key.slice(1) + ":",
          value: value
        });
      }
    }
    return items;
  };
  
  const metadataItems = getMetadataItems();
  
  return (
    <div className="aws-resource bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="flex-shrink-0 h-10 w-10 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              {getResourceIcon()}
            </span>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-slate-900 dark:text-white">{resourceType}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{resourceId}</p>
            </div>
          </div>
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${severity.badge}`}>
            {severity.level.charAt(0).toUpperCase() + severity.level.slice(1)}
          </span>
        </div>
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Region:</span>
              <span className="ml-1 text-slate-700 dark:text-slate-300">{region}</span>
            </div>
            {metadataItems.map((item, index) => (
              <div key={index}>
                <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                <span className="ml-1 text-slate-700 dark:text-slate-300">{item.value}</span>
              </div>
            ))}
            <div>
              <span className="text-slate-500 dark:text-slate-400">Status:</span>
              <span className="ml-1 text-red-600 dark:text-red-400">{status}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-between">
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
            <Clock className="h-4 w-4 mr-1" />
            {timeAgo}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button 
              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800"
              onClick={investigateResource}
            >
              Investigate
            </button>
            <button 
              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800"
              onClick={isolateResource}
              disabled={isolated}
            >
              {isolated ? "Isolated" : "Isolate"}
            </button>
            <button 
              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800"
              onClick={createForensicCopy}
              disabled={forensicCopy}
            >
              {forensicCopy ? "Copy Created" : "Forensic Copy"}
            </button>
            <button 
              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800"
              onClick={destroyResource}
            >
              Destroy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
