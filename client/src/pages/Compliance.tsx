import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, ShieldAlert, ShieldX, AlertCircle, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

// Types
interface ComplianceStandard {
  id: number;
  name: string;
  displayName: string;
  description: string;
  version: string;
  category: string;
  link: string;
  enabled: boolean;
}

interface ComplianceRule {
  id: number;
  standardId: number;
  ruleId: string;
  title: string;
  description: string;
  severity: string;
  resourceTypes: string[];
  action: string;
  remediationSteps: string;
  enabled: boolean;
  providers: string[];
}

interface Resource {
  id: number;
  resourceId: string;
  resourceType: string;
  name: string;
  region: string;
  status: string;
  metadata: any;
  isolated: boolean;
  forensicCopy: boolean;
  discoveredAt: string;
}

interface ResourceCompliance {
  id: number;
  resourceId: number;
  ruleId: number;
  status: string;
  lastChecked: string;
  details: any;
  exemptionReason: string | null;
  exemptionExpiry: string | null;
  exemptedBy: number | null;
  exemptedAt: string | null;
}

interface NonCompliantResource {
  resource: Resource;
  rules: ComplianceRule[];
  compliance: ResourceCompliance[];
}

export default function CompliancePage() {
  const { toast } = useToast();
  const [selectedStandard, setSelectedStandard] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [exemptionDialogOpen, setExemptionDialogOpen] = useState(false);
  const [exemptionData, setExemptionData] = useState({
    resourceId: 0,
    ruleId: 0,
    reason: "",
    expiryDate: "",
    resourceName: "",
    ruleName: ""
  });

  // Get compliance standards
  const { data: standards = [], isLoading: standardsLoading } = useQuery<ComplianceStandard[]>({
    queryKey: ['/api/compliance/standards']
  });

  // Get compliance rules
  const { data: rules = [], isLoading: rulesLoading } = useQuery<ComplianceRule[]>({
    queryKey: ['/api/compliance/rules', { standardId: selectedStandard, provider: selectedProvider }],
    enabled: !!selectedStandard
  });

  // Get non-compliant resources
  const { data: nonCompliantResources = [], isLoading: resourcesLoading, refetch: refetchNonCompliant } = useQuery<NonCompliantResource[]>({
    queryKey: ['/api/compliance/non-compliant-resources', { standardId: selectedStandard }],
    enabled: !!selectedStandard
  });

  // Handle standard selection
  const handleStandardChange = (value: string) => {
    setSelectedStandard(value);
  };

  // Handle provider selection
  const handleProviderChange = (value: string) => {
    setSelectedProvider(value);
  };

  // Open exemption dialog
  const openExemptionDialog = (resourceId: number, ruleId: number, resourceName: string, ruleName: string) => {
    setExemptionData({
      resourceId,
      ruleId,
      reason: "",
      expiryDate: "",
      resourceName,
      ruleName
    });
    setExemptionDialogOpen(true);
  };

  // Handle granting exemption
  const handleGrantExemption = async () => {
    if (!exemptionData.reason) {
      toast({
        title: "Error",
        description: "Please provide a reason for the exemption",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await apiRequest('/api/compliance/exemptions', {
        method: 'POST',
        body: JSON.stringify({
          resourceId: exemptionData.resourceId,
          ruleId: exemptionData.ruleId,
          reason: exemptionData.reason,
          expiryDate: exemptionData.expiryDate || undefined,
          exemptedBy: 1 // Using default user ID (would be from auth context in a real app)
        })
      });
      
      toast({
        title: "Success",
        description: "Exemption granted successfully"
      });
      
      setExemptionDialogOpen(false);
      refetchNonCompliant();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to grant exemption",
        variant: "destructive"
      });
    }
  };

  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-500 hover:bg-red-600";
      case "high":
        return "bg-orange-500 hover:bg-orange-600";
      case "medium":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "low":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  // Get action badge color
  const getActionColor = (action: string) => {
    return action === "enforce" 
      ? "bg-purple-500 hover:bg-purple-600" 
      : "bg-gray-500 hover:bg-gray-600";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Compliance Management</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldCheck className="mr-2 h-5 w-5" />
              Compliance Standards
            </CardTitle>
            <CardDescription>
              Select a compliance standard to view its rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            {standardsLoading ? (
              <div>Loading standards...</div>
            ) : standards?.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <Select value={selectedStandard} onValueChange={handleStandardChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a standard" />
                    </SelectTrigger>
                    <SelectContent>
                      {standards.map((standard: ComplianceStandard) => (
                        <SelectItem key={standard.id} value={standard.id.toString()}>
                          {standard.displayName} ({standard.version})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Select value={selectedProvider} onValueChange={handleProviderChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a cloud provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      <SelectItem value="aws">AWS</SelectItem>
                      <SelectItem value="azure">Azure</SelectItem>
                      <SelectItem value="gcp">GCP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-6 text-center border border-dashed rounded-lg">
                <div>
                  <ShieldAlert className="mx-auto h-8 w-8 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium">No compliance standards found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create compliance standards to start monitoring your infrastructure.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedStandard && (
          <Card>
            <CardHeader>
              <CardTitle>Standard Details</CardTitle>
              <CardDescription>
                {standards?.find((s: ComplianceStandard) => s.id.toString() === selectedStandard)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {standards && selectedStandard && (
                <div className="space-y-4">
                  {(() => {
                    const standard = standards.find((s: ComplianceStandard) => s.id.toString() === selectedStandard);
                    if (!standard) return null;
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <h4 className="text-sm font-medium">Name</h4>
                            <p className="text-sm text-gray-500">{standard.displayName}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">Version</h4>
                            <p className="text-sm text-gray-500">{standard.version}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">Category</h4>
                            <p className="text-sm text-gray-500">{standard.category || "General"}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">Status</h4>
                            <Badge className={standard.enabled ? "bg-green-500" : "bg-gray-500"}>
                              {standard.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </div>
                        {standard.link && (
                          <div>
                            <h4 className="text-sm font-medium">Documentation</h4>
                            <a 
                              href={standard.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:text-blue-700"
                            >
                              View Documentation
                            </a>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {selectedStandard && (
        <Tabs defaultValue="rules" className="space-y-4">
          <TabsList>
            <TabsTrigger value="rules">Compliance Rules</TabsTrigger>
            <TabsTrigger value="resources">Non-Compliant Resources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Rules</CardTitle>
                <CardDescription>
                  Rules for the selected compliance standard
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rulesLoading ? (
                  <div>Loading rules...</div>
                ) : rules?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rule ID</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Resource Types</TableHead>
                          <TableHead>Providers</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rules.map((rule: ComplianceRule) => (
                          <TableRow key={rule.id}>
                            <TableCell className="font-medium">{rule.ruleId}</TableCell>
                            <TableCell>{rule.title}</TableCell>
                            <TableCell>
                              <Badge className={getSeverityColor(rule.severity)}>
                                {rule.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getActionColor(rule.action)}>
                                {rule.action}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {rule.resourceTypes.map((type: string) => (
                                  <Badge key={type} variant="outline">
                                    {type}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {rule.providers.map((provider: string) => (
                                  <Badge key={provider} variant="outline">
                                    {provider.toUpperCase()}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-6 text-center border border-dashed rounded-lg">
                    <div>
                      <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium">No rules found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {selectedProvider !== "all" 
                          ? `No rules available for ${selectedProvider.toUpperCase()} in this standard.` 
                          : "This standard has no rules defined."}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Non-Compliant Resources</CardTitle>
                <CardDescription>
                  Resources that are not compliant with the selected standard
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resourcesLoading ? (
                  <div>Loading non-compliant resources...</div>
                ) : nonCompliantResources?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Resource</TableHead>
                          <TableHead>Resource Type</TableHead>
                          <TableHead>Rules Violated</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {nonCompliantResources.map((item: NonCompliantResource) => (
                          <TableRow key={item.resource.id}>
                            <TableCell className="font-medium">
                              {item.resource.name}
                              <div className="text-xs text-gray-500">
                                {item.resource.resourceId}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.resource.resourceType}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {item.rules.map((rule: ComplianceRule) => (
                                  <div key={rule.id} className="flex items-center gap-1">
                                    <Badge className={getSeverityColor(rule.severity)}>
                                      {rule.severity}
                                    </Badge>
                                    <span className="text-xs">{rule.ruleId}</span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-2">
                                {item.rules.map((rule: ComplianceRule) => {
                                  const compliance = item.compliance.find(c => c.ruleId === rule.id);
                                  return (
                                    <Button 
                                      key={rule.id}
                                      variant="outline" 
                                      size="sm"
                                      disabled={compliance?.status === "exempted"}
                                      onClick={() => openExemptionDialog(
                                        item.resource.id, 
                                        rule.id,
                                        item.resource.name,
                                        rule.title
                                      )}
                                    >
                                      {compliance?.status === "exempted" ? (
                                        <>
                                          <Check className="h-3 w-3 mr-1" />
                                          Exempted
                                        </>
                                      ) : (
                                        "Grant Exemption"
                                      )}
                                    </Button>
                                  );
                                })}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-6 text-center border border-dashed rounded-lg">
                    <div>
                      <ShieldCheck className="mx-auto h-8 w-8 text-green-500" />
                      <h3 className="mt-2 text-sm font-medium">No non-compliant resources</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        All resources are compliant with the selected standard.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Exemption Dialog */}
      <Dialog open={exemptionDialogOpen} onOpenChange={setExemptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Compliance Exemption</DialogTitle>
            <DialogDescription>
              Provide a reason for exempting this resource from the compliance rule.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <h4 className="text-sm font-medium">Resource:</h4>
              <p className="text-sm">{exemptionData.resourceName}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium">Rule:</h4>
              <p className="text-sm">{exemptionData.ruleName}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Exemption*</Label>
              <Textarea
                id="reason"
                value={exemptionData.reason}
                onChange={(e) => setExemptionData({...exemptionData, reason: e.target.value})}
                placeholder="Enter a detailed reason for this exemption"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={exemptionData.expiryDate}
                onChange={(e) => setExemptionData({...exemptionData, expiryDate: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setExemptionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGrantExemption}>
              Grant Exemption
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}