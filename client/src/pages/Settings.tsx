import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  CloudOff, 
  Cloud, 
  CheckCircle2, 
  Clock, 
  Cog,
  FileText
} from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    criticalIncidents: true,
    resourceChanges: true,
    dailyDigest: false,
    securityUpdates: true
  });
  
  // Appearance settings
  const [appearance, setAppearance] = useState({
    darkMode: document.documentElement.classList.contains('dark'),
    compactView: false,
    showResourceIcons: true,
    animateCharts: true,
    highContrastMode: false
  });
  
  // CISO-specific settings
  const [reportSettings, setReportSettings] = useState({
    weeklyReports: true,
    includeMetrics: true,
    includeRecommendations: true,
    exportToPdf: true,
    autoShareWithTeam: false
  });
  
  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
    autoLogout: true,
    ipRestrictions: false,
    auditLogging: true
  });
  
  // Integration settings
  const [integrationSettings, setIntegrationSettings] = useState({
    nkaseIntegration: true,
    guardDuty: true,
    securityHub: true,
    cloudTrail: true,
    cloudWatch: false
  });
  
  // Compliance control settings
  const [complianceSettings, setComplianceSettings] = useState({
    pciDss: false,
    hipaa: false,
    nist80053: true,
    iso27001: false,
    gdpr: true,
    soc2: false,
    enableRiskAutomation: true,
    autoRemediation: false,
    requireMfa: true,
    encryptData: true,
    enforcePasswords: false
  });
  
  const handleNotificationChange = (setting: string) => {
    setNotifications({
      ...notifications,
      [setting]: !notifications[setting as keyof typeof notifications]
    });
  };
  
  const handleAppearanceChange = (setting: string) => {
    // Special handling for dark mode to actually update the theme
    if (setting === 'darkMode') {
      const newValue = !appearance.darkMode;
      if (newValue) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
      }
    }
    
    setAppearance({
      ...appearance,
      [setting]: !appearance[setting as keyof typeof appearance]
    });
  };
  
  const handleSecuritySettingChange = (setting: string) => {
    setSecuritySettings({
      ...securitySettings,
      [setting]: !securitySettings[setting as keyof typeof securitySettings]
    });
  };
  
  const handleReportSettingChange = (setting: string) => {
    setReportSettings({
      ...reportSettings,
      [setting]: !reportSettings[setting as keyof typeof reportSettings]
    });
  };
  
  const handleIntegrationChange = (setting: string) => {
    setIntegrationSettings({
      ...integrationSettings,
      [setting]: !integrationSettings[setting as keyof typeof integrationSettings]
    });
  };
  
  const handleComplianceChange = (setting: string) => {
    setComplianceSettings({
      ...complianceSettings,
      [setting]: !complianceSettings[setting as keyof typeof complianceSettings]
    });
  };
  
  const handleSessionTimeoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecuritySettings({
      ...securitySettings,
      sessionTimeout: e.target.value
    });
  };
  
  const saveSettings = () => {
    setSaveLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSaveLoading(false);
      toast({
        title: "Settings saved",
        description: "Your settings have been successfully updated",
      });
    }, 1000);
  };
  
  const enableTwoFactor = () => {
    toast({
      title: "Two-Factor Authentication",
      description: "Setting up two-factor authentication would be handled here",
    });
  };
  
  const testNkaseConnection = () => {
    toast({
      title: "NKASE Connection Test",
      description: "Successfully connected to NKASE services",
    });
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">Settings</h1>
        
        <div className="flex flex-col md:flex-row gap-6">
          <Tabs defaultValue="account" className="w-full flex flex-col md:flex-row gap-6" value={activeTab} onValueChange={setActiveTab}>
            {/* Sidebar */}
            <div className="md:w-64 space-y-2">
              <TabsList className="flex flex-col h-auto bg-transparent space-y-1">
                <TabsTrigger value="account" className="justify-start">
                  <User className="h-5 w-5 mr-2" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="notifications" className="justify-start">
                  <Bell className="h-5 w-5 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="security" className="justify-start">
                  <Shield className="h-5 w-5 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="appearance" className="justify-start">
                  <Cog className="h-5 w-5 mr-2" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="integrations" className="justify-start">
                  <Cloud className="h-5 w-5 mr-2" />
                  Integrations
                </TabsTrigger>
                {user?.role === "ciso" || user?.role === "incident_manager" ? (
                  <>
                    <TabsTrigger value="compliance" className="justify-start">
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Compliance Controls
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="justify-start">
                      <FileText className="h-5 w-5 mr-2" />
                      Reports
                    </TabsTrigger>
                  </>
                ) : null}
              </TabsList>
            </div>
            
            {/* Content */}
            <div className="flex-1">
            <TabsContent value="account" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your personal account settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden">
                        <img 
                          src={user?.avatarUrl || "https://via.placeholder.com/64"} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{user?.fullName}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{user?.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input 
                          id="fullName" 
                          defaultValue={user?.fullName} 
                          className="mt-1" 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          defaultValue={`${user?.username}@example.com`} 
                          className="mt-1" 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input 
                          id="username" 
                          defaultValue={user?.username} 
                          className="mt-1" 
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Password</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input 
                            id="currentPassword" 
                            type="password" 
                            placeholder="••••••••" 
                            className="mt-1" 
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input 
                            id="newPassword" 
                            type="password" 
                            placeholder="••••••••" 
                            className="mt-1" 
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input 
                            id="confirmPassword" 
                            type="password" 
                            placeholder="••••••••" 
                            className="mt-1" 
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={saveSettings} disabled={saveLoading}>
                        {saveLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Configure how and when you receive alerts and notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="emailAlerts">Email Alerts</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Receive security alerts via email
                        </p>
                      </div>
                      <Switch 
                        id="emailAlerts" 
                        checked={notifications.emailAlerts}
                        onCheckedChange={() => handleNotificationChange('emailAlerts')}
                      />
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="criticalIncidents">Critical Incidents</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Get notified immediately about critical security incidents
                        </p>
                      </div>
                      <Switch 
                        id="criticalIncidents" 
                        checked={notifications.criticalIncidents}
                        onCheckedChange={() => handleNotificationChange('criticalIncidents')}
                      />
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="resourceChanges">Resource Changes</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Notifications when NKASE resources are modified
                        </p>
                      </div>
                      <Switch 
                        id="resourceChanges" 
                        checked={notifications.resourceChanges}
                        onCheckedChange={() => handleNotificationChange('resourceChanges')}
                      />
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="dailyDigest">Daily Digest</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Receive a daily summary of all security events
                        </p>
                      </div>
                      <Switch 
                        id="dailyDigest" 
                        checked={notifications.dailyDigest}
                        onCheckedChange={() => handleNotificationChange('dailyDigest')}
                      />
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="securityUpdates">Security Updates</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Get notified about platform security updates
                        </p>
                      </div>
                      <Switch 
                        id="securityUpdates" 
                        checked={notifications.securityUpdates}
                        onCheckedChange={() => handleNotificationChange('securityUpdates')}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={saveSettings} disabled={saveLoading}>
                        {saveLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Configure your account security and access controls
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="twoFactorAuth" 
                          checked={securitySettings.twoFactorAuth}
                          onCheckedChange={() => handleSecuritySettingChange('twoFactorAuth')}
                        />
                        {!securitySettings.twoFactorAuth && (
                          <Button variant="outline" size="sm" onClick={enableTwoFactor}>
                            <Lock className="h-4 w-4 mr-2" />
                            Setup
                          </Button>
                        )}
                      </div>
                    </div>
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input 
                        id="sessionTimeout" 
                        type="number" 
                        value={securitySettings.sessionTimeout} 
                        onChange={handleSessionTimeoutChange}
                        min="5"
                        max="120"
                      />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        How long before your session expires due to inactivity
                      </p>
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoLogout">Auto Logout</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Automatically log out when browser is closed
                        </p>
                      </div>
                      <Switch 
                        id="autoLogout" 
                        checked={securitySettings.autoLogout}
                        onCheckedChange={() => handleSecuritySettingChange('autoLogout')}
                      />
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="ipRestrictions">IP Restrictions</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Limit access to trusted IP addresses only
                        </p>
                      </div>
                      <Switch 
                        id="ipRestrictions" 
                        checked={securitySettings.ipRestrictions}
                        onCheckedChange={() => handleSecuritySettingChange('ipRestrictions')}
                      />
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auditLogging">Audit Logging</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Log all actions performed on your account
                        </p>
                      </div>
                      <Switch 
                        id="auditLogging" 
                        checked={securitySettings.auditLogging}
                        onCheckedChange={() => handleSecuritySettingChange('auditLogging')}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={saveSettings} disabled={saveLoading}>
                        {saveLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>
                    Customize the look and feel of your dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="darkMode">Dark Mode</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Enable dark theme for the application
                        </p>
                      </div>
                      <Switch 
                        id="darkMode" 
                        checked={appearance.darkMode}
                        onCheckedChange={() => handleAppearanceChange('darkMode')}
                      />
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="compactView">Compact View</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Display more information with less spacing
                        </p>
                      </div>
                      <Switch 
                        id="compactView" 
                        checked={appearance.compactView}
                        onCheckedChange={() => handleAppearanceChange('compactView')}
                      />
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showResourceIcons">Show Resource Icons</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Display icons next to NKASE resources
                        </p>
                      </div>
                      <Switch 
                        id="showResourceIcons" 
                        checked={appearance.showResourceIcons}
                        onCheckedChange={() => handleAppearanceChange('showResourceIcons')}
                      />
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="animateCharts">Animate Charts</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Enable chart animations in the dashboard
                        </p>
                      </div>
                      <Switch 
                        id="animateCharts" 
                        checked={appearance.animateCharts}
                        onCheckedChange={() => handleAppearanceChange('animateCharts')}
                      />
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="highContrastMode">High Contrast Mode</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Increase visual contrast for better accessibility
                        </p>
                      </div>
                      <Switch 
                        id="highContrastMode" 
                        checked={appearance.highContrastMode}
                        onCheckedChange={() => handleAppearanceChange('highContrastMode')}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={saveSettings} disabled={saveLoading}>
                        {saveLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="integrations" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>NKASE Integrations</CardTitle>
                  <CardDescription>
                    Configure connections to NKASE security services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="nkaseIntegration">NKASE Integration</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Connect to your NKASE environment
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="nkaseIntegration" 
                          checked={integrationSettings.nkaseIntegration}
                          onCheckedChange={() => handleIntegrationChange('nkaseIntegration')}
                        />
                        <Button variant="outline" size="sm" onClick={testNkaseConnection}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Test
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="guardDuty">NKASE GuardDuty</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Ingest findings from NKASE GuardDuty
                        </p>
                      </div>
                      <Switch 
                        id="guardDuty" 
                        checked={integrationSettings.guardDuty}
                        onCheckedChange={() => handleIntegrationChange('guardDuty')}
                        disabled={!integrationSettings.nkaseIntegration}
                      />
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="securityHub">NKASE Security Hub</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Import findings from NKASE Security Hub
                        </p>
                      </div>
                      <Switch 
                        id="securityHub" 
                        checked={integrationSettings.securityHub}
                        onCheckedChange={() => handleIntegrationChange('securityHub')}
                        disabled={!integrationSettings.nkaseIntegration}
                      />
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="cloudTrail">NKASE Cloud Trail</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Monitor audit events and activities
                        </p>
                      </div>
                      <Switch 
                        id="cloudTrail" 
                        checked={integrationSettings.cloudTrail}
                        onCheckedChange={() => handleIntegrationChange('cloudTrail')}
                        disabled={!integrationSettings.nkaseIntegration}
                      />
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="cloudWatch">NKASE CloudWatch</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Collect metrics and monitoring data
                        </p>
                      </div>
                      <Switch 
                        id="cloudWatch" 
                        checked={integrationSettings.cloudWatch}
                        onCheckedChange={() => handleIntegrationChange('cloudWatch')}
                        disabled={!integrationSettings.nkaseIntegration}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={saveSettings} disabled={saveLoading}>
                        {saveLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {(user?.role === "ciso" || user?.role === "incident_manager") && (
              <TabsContent value="compliance" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Compliance Controls</CardTitle>
                    <CardDescription>
                      Configure security compliance frameworks and preventative controls
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium mb-4">Compliance Frameworks</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="pciDss">PCI DSS</Label>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Payment Card Industry Data Security Standard
                            </p>
                          </div>
                          <Switch 
                            id="pciDss" 
                            checked={complianceSettings.pciDss}
                            onCheckedChange={() => handleComplianceChange('pciDss')}
                          />
                        </div>
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="hipaa">HIPAA</Label>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Health Insurance Portability and Accountability Act
                            </p>
                          </div>
                          <Switch 
                            id="hipaa" 
                            checked={complianceSettings.hipaa}
                            onCheckedChange={() => handleComplianceChange('hipaa')}
                          />
                        </div>
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="nist80053">NIST 800-53</Label>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Security controls for federal information systems
                            </p>
                          </div>
                          <Switch 
                            id="nist80053" 
                            checked={complianceSettings.nist80053}
                            onCheckedChange={() => handleComplianceChange('nist80053')}
                          />
                        </div>
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="iso27001">ISO 27001</Label>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              International standard for information security
                            </p>
                          </div>
                          <Switch 
                            id="iso27001" 
                            checked={complianceSettings.iso27001}
                            onCheckedChange={() => handleComplianceChange('iso27001')}
                          />
                        </div>
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="gdpr">GDPR</Label>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              General Data Protection Regulation (EU)
                            </p>
                          </div>
                          <Switch 
                            id="gdpr" 
                            checked={complianceSettings.gdpr}
                            onCheckedChange={() => handleComplianceChange('gdpr')}
                          />
                        </div>
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="soc2">SOC 2</Label>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Service Organization Control 2
                            </p>
                          </div>
                          <Switch 
                            id="soc2" 
                            checked={complianceSettings.soc2}
                            onCheckedChange={() => handleComplianceChange('soc2')}
                          />
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-medium mt-8 mb-4">Preventative Controls</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="enableRiskAutomation">Risk Automation</Label>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Automatically detect and classify risk levels
                            </p>
                          </div>
                          <Switch 
                            id="enableRiskAutomation" 
                            checked={complianceSettings.enableRiskAutomation}
                            onCheckedChange={() => handleComplianceChange('enableRiskAutomation')}
                          />
                        </div>
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="autoRemediation">Auto-Remediation</Label>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Automatically fix common compliance issues
                            </p>
                          </div>
                          <Switch 
                            id="autoRemediation" 
                            checked={complianceSettings.autoRemediation}
                            onCheckedChange={() => handleComplianceChange('autoRemediation')}
                          />
                        </div>
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="requireMfa">Require MFA</Label>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Enforce multi-factor authentication for all users
                            </p>
                          </div>
                          <Switch 
                            id="requireMfa" 
                            checked={complianceSettings.requireMfa}
                            onCheckedChange={() => handleComplianceChange('requireMfa')}
                          />
                        </div>
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="encryptData">Encrypt Data</Label>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Enforce encryption for all data at rest and in transit
                            </p>
                          </div>
                          <Switch 
                            id="encryptData" 
                            checked={complianceSettings.encryptData}
                            onCheckedChange={() => handleComplianceChange('encryptData')}
                          />
                        </div>
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="enforcePasswords">Password Policy</Label>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Enforce strong password requirements
                            </p>
                          </div>
                          <Switch 
                            id="enforcePasswords" 
                            checked={complianceSettings.enforcePasswords}
                            onCheckedChange={() => handleComplianceChange('enforcePasswords')}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button onClick={saveSettings} disabled={saveLoading}>
                          {saveLoading ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            {user?.role === "ciso" && (
              <TabsContent value="reports" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Report Settings</CardTitle>
                    <CardDescription>
                      Configure automated security reports and dashboards
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="weeklyReports">Weekly Executive Reports</Label>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Generate weekly security reports
                          </p>
                        </div>
                        <Switch 
                          id="weeklyReports" 
                          checked={reportSettings.weeklyReports}
                          onCheckedChange={() => handleReportSettingChange('weeklyReports')}
                        />
                      </div>
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="includeMetrics">Include Security Metrics</Label>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Add key security metrics to reports
                          </p>
                        </div>
                        <Switch 
                          id="includeMetrics" 
                          checked={reportSettings.includeMetrics}
                          onCheckedChange={() => handleReportSettingChange('includeMetrics')}
                        />
                      </div>
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="includeRecommendations">Include Recommendations</Label>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Provide security improvement recommendations
                          </p>
                        </div>
                        <Switch 
                          id="includeRecommendations" 
                          checked={reportSettings.includeRecommendations}
                          onCheckedChange={() => handleReportSettingChange('includeRecommendations')}
                        />
                      </div>
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="exportToPdf">Export to PDF</Label>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Automatically export reports to PDF
                          </p>
                        </div>
                        <Switch 
                          id="exportToPdf" 
                          checked={reportSettings.exportToPdf}
                          onCheckedChange={() => handleReportSettingChange('exportToPdf')}
                        />
                      </div>
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="autoShareWithTeam">Auto-Share with Team</Label>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Automatically distribute reports to security team
                          </p>
                        </div>
                        <Switch 
                          id="autoShareWithTeam" 
                          checked={reportSettings.autoShareWithTeam}
                          onCheckedChange={() => handleReportSettingChange('autoShareWithTeam')}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button onClick={saveSettings} disabled={saveLoading}>
                          {saveLoading ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
