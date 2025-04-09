import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, ShieldAlert, Server, CloudCog, AlertTriangle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ComplianceSummary {
  totalResources: number;
  compliantResources: number;
  nonCompliantResources: number;
  compliancePercentage: number;
  nonCompliantByProvider: Record<string, number>;
  nonCompliantBySeverity: Record<string, number>;
  enforceRulesByStandard: Record<string, number>;
  accountEnforcement: Array<{
    accountId: string;
    accountName: string;
    provider: string;
    enforceRulesCount: number;
    totalRulesCount: number;
    enforcementPercentage: number;
  }>;
  totalEnforceRules: number;
  totalRules: number;
}

export default function CISOView() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Fetch compliance summary data
  const { data: complianceSummary, isLoading, error } = useQuery<ComplianceSummary>({
    queryKey: ['/api/compliance/summary'],
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // If there's an error, show a toast
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error loading compliance data",
        description: "There was a problem loading the compliance summary data.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Convert object to array for charts
  const getNonCompliantByProviderData = () => {
    if (!complianceSummary?.nonCompliantByProvider) return [];
    
    return Object.entries(complianceSummary.nonCompliantByProvider).map(([provider, count]) => ({
      name: provider.toUpperCase(),
      value: count
    }));
  };

  const getNonCompliantBySeverityData = () => {
    if (!complianceSummary?.nonCompliantBySeverity) return [];
    
    const severityOrder = ["low", "medium", "high", "critical"];
    
    return Object.entries(complianceSummary.nonCompliantBySeverity)
      .sort((a, b) => severityOrder.indexOf(a[0]) - severityOrder.indexOf(b[0]))
      .map(([severity, count]) => ({
        name: severity.charAt(0).toUpperCase() + severity.slice(1),
        value: count
      }));
  };

  const getEnforceRulesByStandardData = () => {
    if (!complianceSummary?.enforceRulesByStandard) return [];
    
    return Object.entries(complianceSummary.enforceRulesByStandard).map(([standard, count]) => ({
      name: standard.replace('_', ' ').toUpperCase(),
      value: count
    }));
  };

  // COLORS for charts
  const PROVIDER_COLORS = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6'];
  const SEVERITY_COLORS: Record<string, string> = {
    'Low': '#10B981',
    'Medium': '#F59E0B',
    'High': '#F97316',
    'Critical': '#EF4444'
  };
  const STANDARD_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">CISO View</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Compliance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Non-Compliant by Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Non-Compliant by Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">CISO View</h1>
        <div className="flex space-x-2 border rounded-md p-1">
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'overview' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'accounts' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            Accounts
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'standards' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
            onClick={() => setActiveTab('standards')}
          >
            Standards
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Server className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{complianceSummary?.totalResources || 0}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Compliant Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">{complianceSummary?.compliantResources || 0}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Non-Compliant Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                  <span className="text-2xl font-bold">{complianceSummary?.nonCompliantResources || 0}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Overall Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Shield className={`h-5 w-5 ${
                      (complianceSummary?.compliancePercentage || 0) >= 90 ? 'text-green-500' : 
                      (complianceSummary?.compliancePercentage || 0) >= 70 ? 'text-yellow-500' : 
                      'text-red-500'}`} 
                    />
                    <span className="text-2xl font-bold">{Math.round(complianceSummary?.compliancePercentage || 0)}%</span>
                  </div>
                  <Progress 
                    value={complianceSummary?.compliancePercentage || 0} 
                    className={`h-2 ${
                      (complianceSummary?.compliancePercentage || 0) >= 90 ? 'bg-green-100' : 
                      (complianceSummary?.compliancePercentage || 0) >= 70 ? 'bg-yellow-100' : 
                      'bg-red-100'}`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Auto-Enforcement Coverage</CardTitle>
                <CardDescription>
                  {complianceSummary?.totalEnforceRules || 0} of {complianceSummary?.totalRules || 0} rules set to auto-enforce
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Enforced', value: complianceSummary?.totalEnforceRules || 0 },
                          { name: 'Not Enforced', value: (complianceSummary?.totalRules || 0) - (complianceSummary?.totalEnforceRules || 0) }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                      >
                        <Cell fill="#3B82F6" />
                        <Cell fill="#CBD5E1" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Non-Compliant by Provider</CardTitle>
                <CardDescription>
                  Distribution across cloud providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getNonCompliantByProviderData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                      >
                        {getNonCompliantByProviderData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PROVIDER_COLORS[index % PROVIDER_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Non-Compliant by Severity</CardTitle>
                <CardDescription>
                  Distribution across severity levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getNonCompliantBySeverityData()}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" name="Count">
                        {getNonCompliantBySeverityData().map((entry, index) => {
                          const key = entry.name as keyof typeof SEVERITY_COLORS;
                          return <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[key] || '#8884d8'} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {activeTab === 'accounts' && (
        <Card>
          <CardHeader>
            <CardTitle>Account Enforcement Coverage</CardTitle>
            <CardDescription>
              Percentage of applicable rules set to auto-enforce by account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {complianceSummary?.accountEnforcement && complianceSummary.accountEnforcement.length > 0 ? (
                complianceSummary.accountEnforcement.map((account) => (
                  <div key={account.accountId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CloudCog className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="text-sm font-medium">{account.accountName}</h4>
                          <p className="text-xs text-muted-foreground">{account.provider.toUpperCase()} | {account.accountId}</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">
                        {account.enforceRulesCount} of {account.totalRulesCount} rules enforced
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={account.enforcementPercentage} 
                        className={`h-2 flex-1 ${
                          account.enforcementPercentage >= 90 ? 'bg-green-100' : 
                          account.enforcementPercentage >= 70 ? 'bg-yellow-100' : 
                          'bg-red-100'}`}
                      />
                      <span className="text-sm font-medium w-12 text-right">
                        {Math.round(account.enforcementPercentage)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <AlertTriangle className="h-10 w-10 text-yellow-500 mb-4" />
                  <h3 className="text-lg font-medium">No Account Data</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    No cloud accounts have been configured or integrated. Add cloud accounts to view enforcement coverage.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'standards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Standards Compliance</CardTitle>
              <CardDescription>
                Overall compliance status by standard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={[
                      { name: 'NIST 800-53', compliance: 78 },
                      { name: 'PCI DSS', compliance: 85 },
                      { name: 'HIPAA', compliance: 92 }
                    ]}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 100,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="compliance" name="Compliance %" barSize={20}>
                      {[
                        { name: 'NIST 800-53', compliance: 78 },
                        { name: 'PCI DSS', compliance: 85 },
                        { name: 'HIPAA', compliance: 92 }
                      ].map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.compliance >= 90 ? '#10B981' : 
                            entry.compliance >= 80 ? '#3B82F6' : 
                            entry.compliance >= 70 ? '#F59E0B' : 
                            '#EF4444'
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}