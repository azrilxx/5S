import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/components/auth/auth-provider";
import { Bell, Plus, Edit2, Trash2, Shield, AlertTriangle, CheckCircle, Clock, Mail, MessageSquare } from "lucide-react";

interface NotificationRule {
  id: number;
  name: string;
  description: string;
  trigger: "overdue_task" | "failed_audit" | "action_created" | "audit_completed" | "user_created";
  conditions: {
    priority?: string[];
    zones?: string[];
    roles?: string[];
    daysOverdue?: number;
    scoreThreshold?: number;
  };
  actions: {
    email: boolean;
    slack: boolean;
    inApp: boolean;
  };
  recipients: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

interface Zone {
  id: number;
  name: string;
  type: string;
}

const triggerOptions = [
  { value: "overdue_task", label: "Overdue Task", icon: Clock, color: "bg-red-100 text-red-800" },
  { value: "failed_audit", label: "Failed Audit", icon: AlertTriangle, color: "bg-orange-100 text-orange-800" },
  { value: "action_created", label: "Action Created", icon: Plus, color: "bg-blue-100 text-blue-800" },
  { value: "audit_completed", label: "Audit Completed", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  { value: "user_created", label: "User Created", icon: Plus, color: "bg-purple-100 text-purple-800" },
];

export default function NotificationRules() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: rules = [], isLoading: rulesLoading } = useQuery<NotificationRule[]>({
    queryKey: ["/api/notification-rules"],
    enabled: user?.role === 'admin',
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: user?.role === 'admin',
  });

  const { data: zones = [], isLoading: zonesLoading } = useQuery<Zone[]>({
    queryKey: ["/api/zones"],
    enabled: user?.role === 'admin',
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
    mutationFn: async (ruleData: NotificationRule) => {
      const response = await fetch(`/api/notification-rules/${ruleData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(ruleData),
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
    mutationFn: async (ruleId: number) => {
      const response = await fetch(`/api/notification-rules/${ruleId}`, {
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

  const toggleRuleStatus = useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: number; isActive: boolean }) => {
      const response = await fetch(`/api/notification-rules/${ruleId}/toggle`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error("Failed to toggle notification rule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-rules"] });
      toast({ title: "Notification rule updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update notification rule", variant: "destructive" });
    },
  });

  const handleCreateRule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const ruleData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      trigger: formData.get("trigger") as NotificationRule["trigger"],
      conditions: {
        priority: Array.from(formData.getAll("priority")) as string[],
        zones: Array.from(formData.getAll("zones")) as string[],
        roles: Array.from(formData.getAll("roles")) as string[],
        daysOverdue: formData.get("daysOverdue") ? parseInt(formData.get("daysOverdue") as string) : undefined,
        scoreThreshold: formData.get("scoreThreshold") ? parseInt(formData.get("scoreThreshold") as string) : undefined,
      },
      actions: {
        email: formData.get("email") === "on",
        slack: formData.get("slack") === "on",
        inApp: formData.get("inApp") === "on",
      },
      recipients: Array.from(formData.getAll("recipients")) as string[],
      isActive: true,
    };
    
    createRuleMutation.mutate(ruleData);
  };

  const handleUpdateRule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRule) return;
    
    const formData = new FormData(e.currentTarget);
    
    const ruleData = {
      ...editingRule,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      trigger: formData.get("trigger") as NotificationRule["trigger"],
      conditions: {
        priority: Array.from(formData.getAll("priority")) as string[],
        zones: Array.from(formData.getAll("zones")) as string[],
        roles: Array.from(formData.getAll("roles")) as string[],
        daysOverdue: formData.get("daysOverdue") ? parseInt(formData.get("daysOverdue") as string) : undefined,
        scoreThreshold: formData.get("scoreThreshold") ? parseInt(formData.get("scoreThreshold") as string) : undefined,
      },
      actions: {
        email: formData.get("email") === "on",
        slack: formData.get("slack") === "on",
        inApp: formData.get("inApp") === "on",
      },
      recipients: Array.from(formData.getAll("recipients")) as string[],
    };
    
    updateRuleMutation.mutate(ruleData);
  };

  const getTriggerInfo = (trigger: string) => {
    return triggerOptions.find(opt => opt.value === trigger);
  };

  if (rulesLoading || usersLoading || zonesLoading) {
    return <div className="p-6">Loading notification rules...</div>;
  }

  // Only admins can access this page
  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access notification rules.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Notification Rules</h1>
        <p className="text-gray-600">
          Configure automated notifications for system events and user actions
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Rules</p>
                <p className="text-2xl font-bold text-gray-900">{rules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Rules</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rules.filter(rule => rule.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive Rules</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rules.filter(rule => !rule.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Manage notification rules for automated alerts
          </span>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Create Rule Form */}
      {showCreateForm && (
        <Card className="mb-6">
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
                  <Input id="name" name="name" required placeholder="Enter rule name..." />
                </div>
                <div>
                  <Label htmlFor="trigger">Trigger Event</Label>
                  <Select name="trigger" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger event" />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Describe when this rule should trigger..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority Conditions</Label>
                  <div className="space-y-2 mt-2">
                    {["low", "medium", "high", "critical"].map((priority) => (
                      <div key={priority} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`priority-${priority}`}
                          name="priority"
                          value={priority}
                        />
                        <Label htmlFor={`priority-${priority}`} className="text-sm capitalize">
                          {priority}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Zone Conditions</Label>
                  <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                    {zones.map((zone) => (
                      <div key={zone.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`zone-${zone.id}`}
                          name="zones"
                          value={zone.name}
                        />
                        <Label htmlFor={`zone-${zone.id}`} className="text-sm">
                          {zone.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="daysOverdue">Days Overdue (Optional)</Label>
                  <Input id="daysOverdue" name="daysOverdue" type="number" min="1" />
                </div>
                <div>
                  <Label htmlFor="scoreThreshold">Score Threshold (Optional)</Label>
                  <Input id="scoreThreshold" name="scoreThreshold" type="number" min="0" max="100" />
                </div>
              </div>
              <div>
                <Label>Notification Actions</Label>
                <div className="flex space-x-6 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="email" name="email" />
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="slack" name="slack" />
                    <Label htmlFor="slack" className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Slack
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="inApp" name="inApp" defaultChecked />
                    <Label htmlFor="inApp" className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      In-App
                    </Label>
                  </div>
                </div>
              </div>
              <div>
                <Label>Recipients</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`recipient-${user.id}`}
                        name="recipients"
                        value={user.email}
                      />
                      <Label htmlFor={`recipient-${user.id}`} className="text-sm">
                        {user.name} ({user.email})
                      </Label>
                    </div>
                  ))}
                </div>
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
          <CardTitle>Notification Rules</CardTitle>
          <CardDescription>
            Manage your automated notification rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No notification rules configured.</p>
                <p className="text-sm">Click "Create Rule" to set up your first notification rule.</p>
              </div>
            ) : (
              rules.map((rule) => {
                const triggerInfo = getTriggerInfo(rule.trigger);
                const TriggerIcon = triggerInfo?.icon || Bell;
                
                return (
                  <div key={rule.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <TriggerIcon className="w-5 h-5 text-blue-600" />
                          <h3 className="font-medium">{rule.name}</h3>
                          <Badge className={triggerInfo?.color || "bg-gray-100 text-gray-800"}>
                            {triggerInfo?.label || rule.trigger}
                          </Badge>
                          <Badge variant={rule.isActive ? "default" : "secondary"}>
                            {rule.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {rule.actions.email && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              Email
                            </Badge>
                          )}
                          {rule.actions.slack && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              Slack
                            </Badge>
                          )}
                          {rule.actions.inApp && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Bell className="w-3 h-3" />
                              In-App
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {rule.recipients.length} recipients
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(checked) => 
                            toggleRuleStatus.mutate({ ruleId: rule.id, isActive: checked })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRule(rule)}
                          title="Edit rule"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRuleMutation.mutate(rule.id)}
                          title="Delete rule"
                          disabled={deleteRuleMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Notification Rule</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateRule} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Rule Name</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={editingRule.name}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-trigger">Trigger Event</Label>
                    <Select name="trigger" defaultValue={editingRule.trigger}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {triggerOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    defaultValue={editingRule.description}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority Conditions</Label>
                    <div className="space-y-2 mt-2">
                      {["low", "medium", "high", "critical"].map((priority) => (
                        <div key={priority} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`edit-priority-${priority}`}
                            name="priority"
                            value={priority}
                            defaultChecked={editingRule.conditions.priority?.includes(priority)}
                          />
                          <Label htmlFor={`edit-priority-${priority}`} className="text-sm capitalize">
                            {priority}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Zone Conditions</Label>
                    <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                      {zones.map((zone) => (
                        <div key={zone.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`edit-zone-${zone.id}`}
                            name="zones"
                            value={zone.name}
                            defaultChecked={editingRule.conditions.zones?.includes(zone.name)}
                          />
                          <Label htmlFor={`edit-zone-${zone.id}`} className="text-sm">
                            {zone.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-daysOverdue">Days Overdue (Optional)</Label>
                    <Input
                      id="edit-daysOverdue"
                      name="daysOverdue"
                      type="number"
                      min="1"
                      defaultValue={editingRule.conditions.daysOverdue}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-scoreThreshold">Score Threshold (Optional)</Label>
                    <Input
                      id="edit-scoreThreshold"
                      name="scoreThreshold"
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={editingRule.conditions.scoreThreshold}
                    />
                  </div>
                </div>
                <div>
                  <Label>Notification Actions</Label>
                  <div className="flex space-x-6 mt-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-email"
                        name="email"
                        defaultChecked={editingRule.actions.email}
                      />
                      <Label htmlFor="edit-email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-slack"
                        name="slack"
                        defaultChecked={editingRule.actions.slack}
                      />
                      <Label htmlFor="edit-slack" className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Slack
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-inApp"
                        name="inApp"
                        defaultChecked={editingRule.actions.inApp}
                      />
                      <Label htmlFor="edit-inApp" className="flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        In-App
                      </Label>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Recipients</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`edit-recipient-${user.id}`}
                          name="recipients"
                          value={user.email}
                          defaultChecked={editingRule.recipients.includes(user.email)}
                        />
                        <Label htmlFor={`edit-recipient-${user.id}`} className="text-sm">
                          {user.name} ({user.email})
                        </Label>
                      </div>
                    ))}
                  </div>
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