import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Bell, Mail, MessageSquare, Plus, Edit2, Trash2, Play } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

interface NotificationRule {
  id: number;
  name: string;
  description: string;
  trigger: string;
  conditions: string;
  actions: string;
  recipients: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function NotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: rules = [], isLoading } = useQuery<NotificationRule[]>({
    queryKey: ["/api/notification-rules"],
  });

  const createRuleMutation = useMutation({
    mutationFn: async (ruleData: Omit<NotificationRule, "id" | "createdAt" | "updatedAt">) => {
      const response = await fetch("/api/notification-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(ruleData),
      });
      if (!response.ok) throw new Error("Failed to create notification rule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-rules"] });
      toast({ title: "Notification rule created successfully" });
      setShowCreateForm(false);
    },
    onError: () => {
      toast({ title: "Failed to create notification rule", variant: "destructive" });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async (rule: NotificationRule) => {
      const response = await fetch(`/api/notification-rules/${rule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(rule),
      });
      if (!response.ok) throw new Error("Failed to update notification rule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-rules"] });
      toast({ title: "Notification rule updated successfully" });
      setEditingRule(null);
    },
    onError: () => {
      toast({ title: "Failed to update notification rule", variant: "destructive" });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/notification-rules/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete notification rule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-rules"] });
      toast({ title: "Notification rule deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete notification rule", variant: "destructive" });
    },
  });

  const triggerNotificationsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notification-rules/trigger", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to trigger notifications");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Notification checks triggered successfully" });
    },
    onError: () => {
      toast({ title: "Failed to trigger notifications", variant: "destructive" });
    },
  });

  const handleCreateRule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const conditions = {
      triggers: [formData.get("trigger") as string]
    };
    
    const actions = {
      email: {
        enabled: formData.get("emailEnabled") === "on",
        template: "default"
      },
      slack: {
        enabled: false,
        webhook: ""
      }
    };
    
    const ruleData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      trigger: formData.get("trigger") as string,
      conditions: JSON.stringify(conditions),
      actions: JSON.stringify(actions),
      recipients: (formData.get("recipients") as string).split(",").map(r => r.trim()).filter(Boolean),
      isActive: formData.get("isActive") === "on",
    };
    
    createRuleMutation.mutate(ruleData);
  };

  const handleUpdateRule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRule) return;
    
    const formData = new FormData(e.currentTarget);
    
    const conditions = {
      triggers: [formData.get("trigger") as string]
    };
    
    const actions = {
      email: {
        enabled: formData.get("emailEnabled") === "on",
        template: "default"
      },
      slack: {
        enabled: false,
        webhook: ""
      }
    };
    
    const updatedRule = {
      ...editingRule,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      trigger: formData.get("trigger") as string,
      conditions: JSON.stringify(conditions),
      actions: JSON.stringify(actions),
      recipients: (formData.get("recipients") as string).split(",").map(r => r.trim()).filter(Boolean),
      isActive: formData.get("isActive") === "on",
    };
    
    updateRuleMutation.mutate(updatedRule);
  };

  const toggleRuleStatus = (rule: NotificationRule) => {
    updateRuleMutation.mutate({
      ...rule,
      isActive: !rule.isActive
    });
  };

  if (isLoading) {
    return <div className="p-6">Loading notification settings...</div>;
  }

  // Only admin/superadmin can access this page
  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access notification settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Notification Settings</h1>
        <p className="text-gray-600">
          Configure automated notifications for overdue actions, failed audits, and system alerts.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Rule
              </Button>
              <Button 
                variant="outline" 
                onClick={() => triggerNotificationsMutation.mutate()}
                disabled={triggerNotificationsMutation.isPending}
              >
                <Play className="w-4 h-4 mr-2" />
                {triggerNotificationsMutation.isPending ? "Triggering..." : "Test Notifications"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Rule Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create Notification Rule</CardTitle>
              <CardDescription>
                Set up automated notifications for specific events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRule} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Rule Name</Label>
                    <Input id="name" name="name" required placeholder="e.g., Overdue Action Alerts" />
                  </div>
                  <div>
                    <Label htmlFor="trigger">Trigger Event</Label>
                    <select 
                      id="trigger" 
                      name="trigger" 
                      required 
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select trigger...</option>
                      <option value="action_overdue">Action Overdue</option>
                      <option value="audit_failed">Audit Failed</option>
                      <option value="audit_assigned">Audit Assigned</option>
                      <option value="action_assigned">Action Assigned</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Brief description of this rule" />
                </div>
                
                <div>
                  <Label htmlFor="recipients">Recipients (comma-separated)</Label>
                  <Input id="recipients" name="recipients" placeholder="azril, calvin, shukri" />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="emailEnabled" name="emailEnabled" defaultChecked />
                  <Label htmlFor="emailEnabled">Enable Email Notifications</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="isActive" name="isActive" defaultChecked />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                
                <div className="flex space-x-2">
                  <Button type="submit" disabled={createRuleMutation.isPending}>
                    {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Rules List */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Rules ({rules.length})</CardTitle>
            <CardDescription>
              Manage your automated notification rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No notification rules configured yet. Create your first rule to get started.
                </div>
              ) : (
                rules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{rule.name}</h3>
                          <Badge variant={rule.isActive ? "default" : "secondary"}>
                            {rule.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">{rule.trigger}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Recipients: {rule.recipients.join(", ")}</span>
                          <span>Updated: {new Date(rule.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={rule.isActive} 
                          onCheckedChange={() => toggleRuleStatus(rule)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRule(rule)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRuleMutation.mutate(rule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Notification Rule</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateRule} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Rule Name</Label>
                  <Input id="edit-name" name="name" defaultValue={editingRule.name} required />
                </div>
                
                <div>
                  <Label htmlFor="edit-trigger">Trigger Event</Label>
                  <select 
                    id="edit-trigger" 
                    name="trigger" 
                    defaultValue={editingRule.trigger}
                    required 
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="action_overdue">Action Overdue</option>
                    <option value="audit_failed">Audit Failed</option>
                    <option value="audit_assigned">Audit Assigned</option>
                    <option value="action_assigned">Action Assigned</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Input id="edit-description" name="description" defaultValue={editingRule.description} />
                </div>
                
                <div>
                  <Label htmlFor="edit-recipients">Recipients (comma-separated)</Label>
                  <Input id="edit-recipients" name="recipients" defaultValue={editingRule.recipients.join(", ")} />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="edit-emailEnabled" 
                    name="emailEnabled" 
                    defaultChecked={JSON.parse(editingRule.actions).email?.enabled || false}
                  />
                  <Label htmlFor="edit-emailEnabled">Enable Email Notifications</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="edit-isActive" 
                    name="isActive" 
                    defaultChecked={editingRule.isActive}
                  />
                  <Label htmlFor="edit-isActive">Active</Label>
                </div>
                
                <div className="flex space-x-2">
                  <Button type="submit" disabled={updateRuleMutation.isPending}>
                    {updateRuleMutation.isPending ? "Updating..." : "Update Rule"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingRule(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}