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
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/components/auth/auth-provider";
import { SuperAdminSettings } from "@/components/settings/super-admin-settings";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Globe, 
  Palette, 
  FileText, 
  Download,
  Eye,
  EyeOff,
  Shield
} from "lucide-react";

interface UserSettings {
  language: string;
  notifications: {
    assignedActions: boolean;
    upcomingAudits: boolean;
    overdueItems: boolean;
  };
  theme: string;
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

// Basic i18n translations
const translations = {
  en: {
    settings: "Settings",
    language: "Language",
    notifications: "Notifications",
    theme: "Theme",
    accountInfo: "Account Information",
    auditHistory: "Audit History",
    assignedActions: "Assigned Actions",
    upcomingAudits: "Upcoming Audits",
    overdueItems: "Overdue Items",
    changePassword: "Change Password",
    oldPassword: "Old Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    updatePassword: "Update Password",
    light: "Light",
    dark: "Dark",
    saveSettings: "Save Settings",
    downloadPdf: "Download PDF",
    completed: "Completed",
    score: "Score"
  },
  ms: {
    settings: "Tetapan",
    language: "Bahasa",
    notifications: "Pemberitahuan",
    theme: "Tema",
    accountInfo: "Maklumat Akaun",
    auditHistory: "Sejarah Audit",
    assignedActions: "Tindakan Ditugaskan",
    upcomingAudits: "Audit Akan Datang",
    overdueItems: "Item Tertunggak",
    changePassword: "Tukar Kata Laluan",
    oldPassword: "Kata Laluan Lama",
    newPassword: "Kata Laluan Baru",
    confirmPassword: "Sahkan Kata Laluan",
    updatePassword: "Kemaskini Kata Laluan",
    light: "Cerah",
    dark: "Gelap",
    saveSettings: "Simpan Tetapan",
    downloadPdf: "Muat Turun PDF",
    completed: "Selesai",
    score: "Skor"
  },
  zh: {
    settings: "设定",
    language: "语言",
    notifications: "通知",
    theme: "主题",
    accountInfo: "账户信息",
    auditHistory: "审计历史",
    assignedActions: "分配的任务",
    upcomingAudits: "即将到来的审计",
    overdueItems: "逾期项目",
    changePassword: "更改密码",
    oldPassword: "旧密码",
    newPassword: "新密码",
    confirmPassword: "确认密码",
    updatePassword: "更新密码",
    light: "亮色",
    dark: "暗色",
    saveSettings: "保存设置",
    downloadPdf: "下载PDF",
    completed: "已完成",
    score: "分数"
  }
};

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [settings, setSettings] = useState<UserSettings>({
    language: "en",
    notifications: {
      assignedActions: true,
      upcomingAudits: true,
      overdueItems: true
    },
    theme: "light"
  });

  // Fetch user settings
  const { data: userSettings, isLoading: settingsLoading } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
    enabled: !!user && user.role !== 'admin',
  });

  // Fetch user's audit history
  const { data: auditHistory = [], isLoading: auditsLoading } = useQuery<Audit[]>({
    queryKey: ["/api/audits/history"],
    enabled: !!user && user.role !== 'admin',
  });

  // Update local settings when data is loaded
  useEffect(() => {
    if (userSettings) {
      setSettings(userSettings);
    }
  }, [userSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: UserSettings) => {
      const response = await fetch("/api/settings", {
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
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: t("saveSettings") + " successful" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
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
      toast({ title: "Password updated successfully" });
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
      toast({ title: "Failed to download PDF", variant: "destructive" });
    }
  };

  // Translation helper
  const t = (key: string) => {
    return (translations as any)[settings.language]?.[key] || key;
  };

  const handleSettingsChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNotificationChange = (key: keyof UserSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
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

  // Show super admin settings for admin users
  if (user?.role === 'admin') {
    return <SuperAdminSettings />;
  }

  // Only allow access to authenticated users
  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  if (settingsLoading) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("settings")}</h1>
        <p className="text-gray-600">
          Manage your account preferences and notification settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t("accountInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Display Name</Label>
                <Input value={user.name} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Username</Label>
                <Input value={user.username} disabled className="bg-gray-50" />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium text-gray-900 mb-4">{t("changePassword")}</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="oldPassword">{t("oldPassword")}</Label>
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
                    <Label htmlFor="newPassword">{t("newPassword")}</Label>
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
                    <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
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
                  {changePasswordMutation.isPending ? "Updating..." : t("updatePassword")}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t("notifications")}
            </CardTitle>
            <CardDescription>
              Choose what notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{t("assignedActions")}</Label>
                <p className="text-sm text-gray-600">Get notified when new actions are assigned to you</p>
              </div>
              <Switch
                checked={settings.notifications.assignedActions}
                onCheckedChange={(checked) => handleNotificationChange('assignedActions', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{t("upcomingAudits")}</Label>
                <p className="text-sm text-gray-600">Get reminded about upcoming audits</p>
              </div>
              <Switch
                checked={settings.notifications.upcomingAudits}
                onCheckedChange={(checked) => handleNotificationChange('upcomingAudits', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{t("overdueItems")}</Label>
                <p className="text-sm text-gray-600">Get alerted when items become overdue</p>
              </div>
              <Switch
                checked={settings.notifications.overdueItems}
                onCheckedChange={(checked) => handleNotificationChange('overdueItems', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Language and Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {t("language")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={settings.language} onValueChange={(value) => handleSettingsChange('language', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ms">Bahasa Malaysia</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                {t("theme")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={settings.theme} onValueChange={(value) => handleSettingsChange('theme', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t("light")}</SelectItem>
                  <SelectItem value="dark">{t("dark")}</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Audit History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t("auditHistory")}
            </CardTitle>
            <CardDescription>
              Your completed audits and their results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {auditsLoading ? (
              <div className="text-center py-4">Loading audit history...</div>
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
                        <Badge variant="secondary">{t("completed")}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {t("score")}: {audit.overallScore}% | {new Date(audit.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadAuditPdf(audit.id)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      {t("downloadPdf")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Settings Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveSettings}
            disabled={saveSettingsMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saveSettingsMutation.isPending ? "Saving..." : t("saveSettings")}
          </Button>
        </div>
      </div>
    </div>
  );
}