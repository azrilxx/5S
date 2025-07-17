import { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import Layout from '@/components/layout/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { TagManagement } from '@/components/settings/tag-management';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Server, 
  Database, 
  Settings, 
  Mail, 
  Users, 
  Activity, 
  Lock, 
  Globe, 
  Zap, 
  AlertTriangle,
  Archive,
  Eye,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Save,
  Key,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Smartphone,
  Wifi,
  HardDrive,
  Cpu,
  Monitor,
  Tags
} from 'lucide-react';

export function SuperAdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    autoBackup: true,
    backupFrequency: 'daily',
    auditRetentionDays: 365,
    sessionTimeout: 30,
    maxFileSize: 10,
    allowedFileTypes: ['pdf', 'jpg', 'png', 'gif'],
    emailNotifications: true,
    smsNotifications: false,
    slackIntegration: false,
    teamsIntegration: false,
    twoFactorAuth: false,
    passwordComplexity: 'medium',
    loginAttempts: 5,
    lockoutDuration: 15,
    apiRateLimit: 1000,
    debugMode: false,
    performanceMonitoring: true,
    errorTracking: true,
    analyticsEnabled: true,
    dataExportEnabled: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    enforceHttps: true,
    corsEnabled: true,
    allowedOrigins: ['https://karisma.com'],
    ipWhitelist: [],
    auditLogging: true,
    encryptSensitiveData: true,
    regularSecurityScans: true,
    vulnerabilityAlerts: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    systemAlerts: true,
    userActivity: true,
    auditReminders: true,
    overdueActions: true,
    systemMaintenance: true,
    securityEvents: true,
    performanceIssues: true,
    backupStatus: true
  });

  const [integrationSettings, setIntegrationSettings] = useState({
    ldapAuth: false,
    ssoEnabled: false,
    apiKeys: [],
    webhooks: [],
    thirdPartyServices: {
      deepseek: true,
      email: true,
      sms: false,
      slack: false,
      teams: false
    }
  });

  const handleSaveSettings = async (settingsType: string, settings: any) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Settings Saved",
        description: `${settingsType} settings have been updated successfully.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSystemAction = async (action: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Action Completed",
        description: `System ${action} completed successfully.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} system. Please try again.`,
        variant: "destructive"
      });
    }
  };

  return (
    <Layout title="Super Admin Settings" subtitle="Advanced system configuration and management">
      <div className="space-y-6">
        <Tabs defaultValue="system" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                      <Switch 
                        id="maintenance-mode"
                        checked={systemSettings.maintenanceMode}
                        onCheckedChange={(checked) => 
                          setSystemSettings({...systemSettings, maintenanceMode: checked})
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-backup">Auto Backup</Label>
                      <Switch 
                        id="auto-backup"
                        checked={systemSettings.autoBackup}
                        onCheckedChange={(checked) => 
                          setSystemSettings({...systemSettings, autoBackup: checked})
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backup-frequency">Backup Frequency</Label>
                      <Select value={systemSettings.backupFrequency} onValueChange={(value) => 
                        setSystemSettings({...systemSettings, backupFrequency: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="retention-days">Audit Retention (Days)</Label>
                      <Input 
                        id="retention-days"
                        type="number"
                        value={systemSettings.auditRetentionDays}
                        onChange={(e) => setSystemSettings({...systemSettings, auditRetentionDays: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="session-timeout">Session Timeout (Minutes)</Label>
                      <Input 
                        id="session-timeout"
                        type="number"
                        value={systemSettings.sessionTimeout}
                        onChange={(e) => setSystemSettings({...systemSettings, sessionTimeout: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-file-size">Max File Size (MB)</Label>
                      <Input 
                        id="max-file-size"
                        type="number"
                        value={systemSettings.maxFileSize}
                        onChange={(e) => setSystemSettings({...systemSettings, maxFileSize: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="api-rate-limit">API Rate Limit (requests/hour)</Label>
                      <Input 
                        id="api-rate-limit"
                        type="number"
                        value={systemSettings.apiRateLimit}
                        onChange={(e) => setSystemSettings({...systemSettings, apiRateLimit: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="debug-mode">Debug Mode</Label>
                      <Switch 
                        id="debug-mode"
                        checked={systemSettings.debugMode}
                        onCheckedChange={(checked) => 
                          setSystemSettings({...systemSettings, debugMode: checked})
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings('System', systemSettings)} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save System Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enforce-https">Enforce HTTPS</Label>
                      <Switch 
                        id="enforce-https"
                        checked={securitySettings.enforceHttps}
                        onCheckedChange={(checked) => 
                          setSecuritySettings({...securitySettings, enforceHttps: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="cors-enabled">CORS Enabled</Label>
                      <Switch 
                        id="cors-enabled"
                        checked={securitySettings.corsEnabled}
                        onCheckedChange={(checked) => 
                          setSecuritySettings({...securitySettings, corsEnabled: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="audit-logging">Audit Logging</Label>
                      <Switch 
                        id="audit-logging"
                        checked={securitySettings.auditLogging}
                        onCheckedChange={(checked) => 
                          setSecuritySettings({...securitySettings, auditLogging: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="encrypt-data">Encrypt Sensitive Data</Label>
                      <Switch 
                        id="encrypt-data"
                        checked={securitySettings.encryptSensitiveData}
                        onCheckedChange={(checked) => 
                          setSecuritySettings({...securitySettings, encryptSensitiveData: checked})
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password-complexity">Password Complexity</Label>
                      <Select value={systemSettings.passwordComplexity} onValueChange={(value) => 
                        setSystemSettings({...systemSettings, passwordComplexity: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-attempts">Max Login Attempts</Label>
                      <Input 
                        id="login-attempts"
                        type="number"
                        value={systemSettings.loginAttempts}
                        onChange={(e) => setSystemSettings({...systemSettings, loginAttempts: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lockout-duration">Lockout Duration (Minutes)</Label>
                      <Input 
                        id="lockout-duration"
                        type="number"
                        value={systemSettings.lockoutDuration}
                        onChange={(e) => setSystemSettings({...systemSettings, lockoutDuration: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                      <Switch 
                        id="two-factor"
                        checked={systemSettings.twoFactorAuth}
                        onCheckedChange={(checked) => 
                          setSystemSettings({...systemSettings, twoFactorAuth: checked})
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings('Security', securitySettings)} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Notification Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">System Notifications</h3>
                    {Object.entries(notificationSettings).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label htmlFor={key} className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <Switch 
                          id={key}
                          checked={value}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({...notificationSettings, [key]: checked})
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Communication Channels</h3>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <Switch 
                        id="email-notifications"
                        checked={systemSettings.emailNotifications}
                        onCheckedChange={(checked) => 
                          setSystemSettings({...systemSettings, emailNotifications: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <Switch 
                        id="sms-notifications"
                        checked={systemSettings.smsNotifications}
                        onCheckedChange={(checked) => 
                          setSystemSettings({...systemSettings, smsNotifications: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="slack-integration">Slack Integration</Label>
                      <Switch 
                        id="slack-integration"
                        checked={systemSettings.slackIntegration}
                        onCheckedChange={(checked) => 
                          setSystemSettings({...systemSettings, slackIntegration: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="teams-integration">Teams Integration</Label>
                      <Switch 
                        id="teams-integration"
                        checked={systemSettings.teamsIntegration}
                        onCheckedChange={(checked) => 
                          setSystemSettings({...systemSettings, teamsIntegration: checked})
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings('Notification', notificationSettings)} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tag Management */}
          <TabsContent value="tags" className="space-y-6">
            <TagManagement />
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  System Integrations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Authentication</h3>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ldap-auth">LDAP Authentication</Label>
                      <Switch 
                        id="ldap-auth"
                        checked={integrationSettings.ldapAuth}
                        onCheckedChange={(checked) => 
                          setIntegrationSettings({...integrationSettings, ldapAuth: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="sso-enabled">Single Sign-On (SSO)</Label>
                      <Switch 
                        id="sso-enabled"
                        checked={integrationSettings.ssoEnabled}
                        onCheckedChange={(checked) => 
                          setIntegrationSettings({...integrationSettings, ssoEnabled: checked})
                        }
                      />
                    </div>

                    <h3 className="font-semibold mt-6">AI Services</h3>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="deepseek-api">DeepSeek API</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant={integrationSettings.thirdPartyServices.deepseek ? "default" : "secondary"}>
                          {integrationSettings.thirdPartyServices.deepseek ? "Active" : "Inactive"}
                        </Badge>
                        <Switch 
                          id="deepseek-api"
                          checked={integrationSettings.thirdPartyServices.deepseek}
                          onCheckedChange={(checked) => 
                            setIntegrationSettings({
                              ...integrationSettings, 
                              thirdPartyServices: {
                                ...integrationSettings.thirdPartyServices,
                                deepseek: checked
                              }
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">API Management</h3>
                    <div className="space-y-2">
                      <Label>API Keys</Label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">3 active API keys</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Key className="h-4 w-4 mr-2" />
                          Manage API Keys
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Webhooks</Label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">2 active webhooks</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Globe className="h-4 w-4 mr-2" />
                          Manage Webhooks
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings('Integration', integrationSettings)} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Integration Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Database</span>
                    </div>
                    <Badge variant="default">Online</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>API Server</span>
                    </div>
                    <Badge variant="default">Online</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>File Storage</span>
                    </div>
                    <Badge variant="default">Online</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span>Email Service</span>
                    </div>
                    <Badge variant="secondary">Degraded</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      <span>CPU Usage</span>
                    </div>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      <span>Memory Usage</span>
                    </div>
                    <span className="text-sm font-medium">62%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span>Database Size</span>
                    </div>
                    <span className="text-sm font-medium">2.4 GB</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Active Users</span>
                    </div>
                    <span className="text-sm font-medium">24</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Maintenance */}
          <TabsContent value="maintenance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Archive className="h-5 w-5" />
                    Database Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleSystemAction('backup')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Create Backup
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleSystemAction('optimize')}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Optimize Database
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleSystemAction('cleanup')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cleanup Old Data
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    System Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleSystemAction('restart')}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restart System
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleSystemAction('clear cache')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleSystemAction('health check')}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Run Health Check
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}