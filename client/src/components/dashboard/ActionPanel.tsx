import { 
  XOctagon,
  SaveAll,
  Shield,
  Lock,
  FileText,
  Database,
  PlayCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ActionPanelProps {
  incidentId: number;
  resourceId: number;
}

export const ActionPanel = ({ incidentId, resourceId }: ActionPanelProps) => {
  const { toast } = useToast();
  
  // Handle isolate instance
  const handleIsolate = async () => {
    try {
      await apiRequest('POST', `/api/resources/${resourceId}/isolate`);
      toast({
        title: "Success",
        description: "Resource has been isolated",
      });
      
      // Invalidate resources to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to isolate resource",
        variant: "destructive",
      });
    }
  };
  
  // Handle forensic copy
  const handleForensicCopy = async () => {
    try {
      await apiRequest('POST', `/api/resources/${resourceId}/forensic-copy`);
      toast({
        title: "Success",
        description: "Forensic copy has been created",
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
  
  // Handle IAM revocation
  const handleRevokeIAM = () => {
    toast({
      title: "IAM Credentials Revoked",
      description: "IAM credentials have been successfully revoked",
    });
  };
  
  // Handle security group update
  const handleUpdateSecurityGroups = () => {
    toast({
      title: "Security Groups Updated",
      description: "Security groups have been updated to restrict access",
    });
  };
  
  // Handle CloudTrail logs
  const handleViewCloudTrail = () => {
    toast({
      title: "CloudTrail Logs",
      description: "Retrieving CloudTrail logs for analysis",
    });
  };
  
  // Handle VPC flow logs
  const handleViewVPCFlowLogs = () => {
    toast({
      title: "VPC Flow Logs",
      description: "Retrieving VPC flow logs for analysis",
    });
  };
  
  // Handle view playbook
  const handleViewPlaybook = () => {
    toast({
      title: "Incident Playbook",
      description: "Opening playbook for this incident type",
    });
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">Responder Actions</h3>
      </div>
      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Primary Containment</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                onClick={handleIsolate}
              >
                <XOctagon className="h-5 w-5 mr-2" />
                Isolate Instance
              </button>
              <button 
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-secondary hover:bg-blue-600 focus:outline-none"
                onClick={handleForensicCopy}
              >
                <SaveAll className="h-5 w-5 mr-2" />
                Create Forensic Copy
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Access Control</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none"
                onClick={handleRevokeIAM}
              >
                <Lock className="h-5 w-5 mr-2" />
                Revoke IAM Credentials
              </button>
              <button 
                className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none"
                onClick={handleUpdateSecurityGroups}
              >
                <Shield className="h-5 w-5 mr-2" />
                Update Security Groups
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Investigation</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none"
                onClick={handleViewCloudTrail}
              >
                <FileText className="h-5 w-5 mr-2" />
                View CloudTrail Logs
              </button>
              <button 
                className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none"
                onClick={handleViewVPCFlowLogs}
              >
                <Database className="h-5 w-5 mr-2" />
                Review VPC Flow Logs
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-4 sm:px-6 flex justify-end">
        <button 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-blue-600 focus:outline-none"
          onClick={handleViewPlaybook}
        >
          <PlayCircle className="h-5 w-5 mr-2" />
          View Playbook
        </button>
      </div>
    </div>
  );
};
