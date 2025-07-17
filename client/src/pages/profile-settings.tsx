import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/lib/i18n";
import { 
  User, 
  Globe, 
  Palette, 
  Shield,
  Bell,
  Eye,
  EyeOff,
  FileText,
  Download,
  Settings as SettingsIcon,
  UserCog
} from "lucide-react";

interface UserSettings {
  language: 'en' | 'zh';
  notifications: {
    assignedActions: boolean;
    upcomingAudits: boolean;
    overdueItems: boolean;
  };
  theme: 'light' | 'dark';
}

interface UserProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  team: string | null;
  zones: string[];
  createdAt: string;
  language?: 'en' | 'zh';
}

interface Audit {
  id: number;
  title: string;
  zone: string;
  auditor: string;
  status: string;
  completedAt: string;
  overallScore: number;
}

export default function ProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage, t } = useI18n();
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [settings, setSettings] = useState<UserSettings>({
    language: 'en',
    notifications: {
      assignedActions: true,
      upcomingAudits: true,
      overdueItems: true
    },
    theme: 'light'
  });

  // Safe getter for notification settings with defaults
  const getNotificationSetting = (key: keyof UserSettings['notifications']) => {
    return settings?.notifications?.[key] ?? true;
  };

  // Safe setter for notification settings
  const setNotificationSetting = (key: keyof UserSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: ""
  });

  // Fetch user profile
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/users/profile"],
    enabled: !!user,
  });

  // Fetch user settings
  const { data: userSettings, isLoading: settingsLoading } = useQuery<UserSettings>({
    queryKey: ["/api/users/settings"],
    enabled: !!user,
  });

  // Fetch user's audit history
  const { data: auditHistory = [], isLoading: auditsLoading } = useQuery<Audit[]>({
    queryKey: ["/api/audits/history"],
    enabled: !!user,
  });

  // Update local state when data is loaded
  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        name: userProfile.name || "",
        email: userProfile.email || ""
      });
      if (userProfile.language) {
        setLanguage(userProfile.language);
      }
    }
  }, [userProfile, setLanguage]);

  useEffect(() => {
    if (userSettings) {
      // Apply safe defaults for user settings
      const safeSettings = {
        language: userSettings.language || 'en',
        notifications: {
          assignedActions: userSettings.notifications?.assignedActions ?? true,
          upcomingAudits: userSettings.notifications?.upcomingAudits ?? true,
          overdueItems: userSettings.notifications?.overdueItems ?? true
        },
        theme: userSettings.theme || 'light'
      };
      setSettings(safeSettings);
    }
  }, [userSettings]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: { name: string; email: string }) => {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
      toast({ title: t("settings.settingsSaved") });
    },
    onError: () => {
      toast({ title: t("messages.actionFailed"), variant: "destructive" });
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: UserSettings) => {
      const response = await fetch("/api/users/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error("Failed to save settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/settings"] });
      toast({ title: t("settings.settingsSaved") });
    },
    onError: () => {
      toast({ title: t("messages.actionFailed"), variant: "destructive" });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwords: { oldPassword: string; newPassword: string }) => {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(passwords),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
      }
      return response.json();
    },
    onSuccess: () => {
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: t("settings.passwordUpdated") });
    },
    onError: (error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  // Download audit PDF
  const downloadAuditPdf = async (auditId: number) => {
    try {
      const response = await fetch(`/api/audits/${auditId}/pdf`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to download PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-${auditId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({ title: t("messages.actionFailed"), variant: "destructive" });
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handleSettingsChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNotificationChange = (key: keyof UserSettings['notifications'], value: boolean) => {
    setNotificationSetting(key, value);
  };

  const handleLanguageChange = (newLanguage: 'en' | 'zh') => {
    setLanguage(newLanguage);
    handleSettingsChange('language', newLanguage);
    
    // Auto-save language preference immediately
    const updatedSettings = { ...settings, language: newLanguage };
    saveSettingsMutation.mutate(updatedSettings, {
      onSuccess: () => {
        toast({
          title: newLanguage === 'en' ? "Language Updated" : "语言已更新",
          description: newLanguage === 'en' ? "Interface language changed to English" : "界面语言已更改为中文"
        });
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: t("settings.passwordMismatch"), variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: t("settings.passwordTooShort"), variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    });
  };

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(settings);
  };

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("auth.accessDenied")}</h2>
          <p className="text-gray-600">{t("auth.loginRequired")}</p>
        </div>
      </div>
    );
  }

  if (profileLoading || settingsLoading) {
    return <div className="p-6">{t("common.loading")}</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("settings.profileSettings")}</h1>
        <p className="text-gray-600">{t("settings.subtitle")}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            {t("settings.profile")}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {t("settings.security")}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            {t("settings.preferences")}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t("settings.auditHistory")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t("settings.personalInfo")}
              </CardTitle>
              <CardDescription>
                Update your personal information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">{t("settings.displayName")}</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your display name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">{t("settings.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t("auth.username")}</Label>
                    <Input value={user.username} disabled className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>{t("settings.role")}</Label>
                    <Input value={user.role} disabled className="bg-gray-50" />
                  </div>
                </div>

                {user.team && (
                  <div>
                    <Label>{t("settings.team")}</Label>
                    <Input value={user.team} disabled className="bg-gray-50" />
                  </div>
                )}

                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? t("common.loading") : t("common.save")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {t("settings.changePassword")}
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="oldPassword">{t("settings.oldPassword")}</Label>
                    <div className="relative">
                      <Input
                        id="oldPassword"
                        type={showOldPassword ? "text" : "password"}
                        value={passwordForm.oldPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                      >
                        {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newPassword">{t("settings.newPassword")}</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">{t("settings.confirmPassword")}</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending ? t("common.loading") : t("settings.updatePassword")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {t("settings.language")}
                </CardTitle>
                <CardDescription>
                  Select your preferred language
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="language-select">{t("settings.language")}</Label>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger id="language-select">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="zh">中文 (Mandarin)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    {language === 'en' ? 'Interface language: English' : '界面语言: 中文'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  {t("settings.theme")}
                </CardTitle>
                <CardDescription>
                  Choose your interface theme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={settings.theme} onValueChange={(value) => handleSettingsChange('theme', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t("settings.light")}</SelectItem>
                    <SelectItem value="dark">{t("settings.dark")}</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {t("settings.notifications")}
              </CardTitle>
              <CardDescription>
                Configure your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">{t("settings.assignedActions")}</Label>
                  <p className="text-sm text-gray-600">Get notified when new actions are assigned to you</p>
                </div>
                <Switch
                  checked={getNotificationSetting('assignedActions')}
                  onCheckedChange={(checked) => handleNotificationChange('assignedActions', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">{t("settings.upcomingAudits")}</Label>
                  <p className="text-sm text-gray-600">Get reminded about upcoming audits</p>
                </div>
                <Switch
                  checked={getNotificationSetting('upcomingAudits')}
                  onCheckedChange={(checked) => handleNotificationChange('upcomingAudits', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">{t("settings.overdueItems")}</Label>
                  <p className="text-sm text-gray-600">Get alerted when items become overdue</p>
                </div>
                <Switch
                  checked={getNotificationSetting('overdueItems')}
                  onCheckedChange={(checked) => handleNotificationChange('overdueItems', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings}
              disabled={saveSettingsMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saveSettingsMutation.isPending ? t("common.loading") : t("settings.saveSettings")}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t("settings.auditHistory")}
              </CardTitle>
              <CardDescription>
                Your completed audits and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditsLoading ? (
                <div className="text-center py-4">{t("common.loading")}</div>
              ) : auditHistory.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No completed audits found</div>
              ) : (
                <div className="space-y-3">
                  {auditHistory.map((audit) => (
                    <div key={audit.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{audit.title}</h4>
                          <Badge variant="outline">{audit.zone}</Badge>
                          <Badge variant="secondary">{t("audit.completed")}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {t("audit.score")}: {audit.overallScore}% | {new Date(audit.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAuditPdf(audit.id)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        {t("common.download")}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}