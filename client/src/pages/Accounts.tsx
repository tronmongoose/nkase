import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Server, Shield, Database, Tag, Info, Cloud, ExternalLink } from 'lucide-react';
import { type CloudAccount } from '@shared/schema';

export default function Accounts() {
  const [cloudProvider, setCloudProvider] = useState<'aws' | 'azure' | 'all'>('all');
  
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['/api/cloud-accounts', cloudProvider !== 'all' ? { provider: cloudProvider } : {}],
    queryFn: async ({ queryKey }) => {
      const [endpoint, params] = queryKey as [string, { provider?: string } | {}];
      const queryParams = 'provider' in params && params.provider ? `?provider=${params.provider}` : '';
      const response = await fetch(`${endpoint}${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      return response.json() as Promise<CloudAccount[]>;
    }
  });

  const handleProviderChange = (value: string) => {
    setCloudProvider(value as 'aws' | 'azure' | 'all');
  };

  const awsAccounts = accounts?.filter(account => account.provider === 'aws') || [];
  const azureAccounts = accounts?.filter(account => account.provider === 'azure') || [];
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cloud Accounts</h1>
          <p className="text-muted-foreground">
            Manage and monitor your cloud provider accounts
          </p>
        </div>
        <Button>
          Add Account
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-8" onValueChange={handleProviderChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Providers</TabsTrigger>
          <TabsTrigger value="aws">AWS</TabsTrigger>
          <TabsTrigger value="azure">Azure</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-20 bg-gray-100 dark:bg-gray-800"></CardHeader>
                  <CardContent className="pt-4">
                    <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800 mb-2"></div>
                    <div className="h-4 w-1/2 bg-gray-100 dark:bg-gray-800"></div>
                  </CardContent>
                </Card>
              ))
            ) : accounts?.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium">No accounts found</h3>
                <p className="text-muted-foreground">Add a cloud provider account to get started.</p>
              </div>
            ) : (
              accounts?.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="aws" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-20 bg-gray-100 dark:bg-gray-800"></CardHeader>
                  <CardContent className="pt-4">
                    <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800 mb-2"></div>
                    <div className="h-4 w-1/2 bg-gray-100 dark:bg-gray-800"></div>
                  </CardContent>
                </Card>
              ))
            ) : awsAccounts.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium">No AWS accounts found</h3>
                <p className="text-muted-foreground">Add an AWS account to get started.</p>
              </div>
            ) : (
              awsAccounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="azure" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-20 bg-gray-100 dark:bg-gray-800"></CardHeader>
                  <CardContent className="pt-4">
                    <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800 mb-2"></div>
                    <div className="h-4 w-1/2 bg-gray-100 dark:bg-gray-800"></div>
                  </CardContent>
                </Card>
              ))
            ) : azureAccounts.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium">No Azure accounts found</h3>
                <p className="text-muted-foreground">Add an Azure account to get started.</p>
              </div>
            ) : (
              azureAccounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AccountCardProps {
  account: CloudAccount;
}

function AccountCard({ account }: AccountCardProps) {
  const providerColor = account.provider === 'aws' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800';
  const statusColor = account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProviderIcon = () => {
    if (account.provider === 'aws') {
      return (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
          <Cloud className="h-5 w-5 text-orange-600" />
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
          <Cloud className="h-5 w-5 text-blue-600" />
        </div>
      );
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          {getProviderIcon()}
          <Badge variant="outline" className={statusColor}>
            {account.status}
          </Badge>
        </div>
        <CardTitle className="mt-2">{account.name}</CardTitle>
        <CardDescription className="flex items-center">
          <span className="font-mono text-xs mr-1">{account.accountId}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Added:</span>
          </div>
          <div className="text-right">{formatDate(account.createdAt)}</div>
          
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Last scan:</span>
          </div>
          <div className="text-right">
            {account.lastScannedAt ? formatDate(account.lastScannedAt) : 'Never'}
          </div>
        </div>
        
        <div className="space-y-1">
          {account.metadata && 'region' in account.metadata && (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1.5">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span>Region</span>
              </div>
              <span>{(account.metadata as any).region}</span>
            </div>
          )}
          
          {account.metadata && 'location' in account.metadata && (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1.5">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span>Location</span>
              </div>
              <span>{(account.metadata as any).location}</span>
            </div>
          )}
          
          {account.metadata && 'services' in account.metadata && Array.isArray((account.metadata as any).services) && (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1.5">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span>Services</span>
              </div>
              <span>{(account.metadata as any).services.length}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="flex gap-2">
          <Badge variant="outline" className={providerColor}>
            {account.provider.toUpperCase()}
          </Badge>
          
          {account.metadata && 'tags' in account.metadata && 
            (account.metadata as any).tags && 
            'Environment' in (account.metadata as any).tags && (
              <Badge variant="outline" className="bg-gray-100">
                {(account.metadata as any).tags.Environment}
              </Badge>
            )}
        </div>
        <Button variant="ghost" size="sm" className="gap-1">
          <ExternalLink className="h-4 w-4" />
          <span className="sr-only md:not-sr-only md:inline-block">View</span>
        </Button>
      </CardFooter>
    </Card>
  );
}