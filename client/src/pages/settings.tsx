import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Settings as SettingsIcon, Bell, Shield, Plus, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ZONES, TEAMS, USER_ROLES } from "@/lib/constants";
import { useAuth } from "@/components/auth/auth-provider";
import Layout from "@/components/layout/layout";

export default function Settings() {
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newUserData, setNewUserData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "auditor",
    team: "",
    zones: [] as string[],
  });
  const [systemSettings, setSystemSettings] = useState({
    auditDuration: 60,
    emailNotifications: true,
    smsNotifications: false,
    autoAssignment: true,
    reminderDays: 1,
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: zones } = useQuery({
    queryKey: ["/api/zones"],
  });

  const { data: teams } = useQuery({
    queryKey: ["/api/teams"],
  });

  const createUserMutation = useMutation({
    mutationFn: (userData: any) => apiRequest("POST", "/api/auth/register", userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowNewUserDialog(false);
      setNewUserData({
        username: "",
        password: "",
        name: "",
        email: "",
        role: "auditor",
        team: "",
        zones: [],
      });
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      apiRequest("PUT", `/api/users/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setSelectedUser(null);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = () => {
    if (!newUserData.username || !newUserData.password || !newUserData.name || !newUserData.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate(newUserData);
  };

  const handleUpdateUser = (updates: any) => {
    if (!selectedUser) return;
    
    updateUserMutation.mutate({
      id: selectedUser.id,
      updates,
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "supervisor":
        return "bg-blue-100 text-blue-800";
      case "auditor":
        return "bg-green-100 text-green-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSystemSettingsChange = (key: string, value: any) => {
    setSystemSettings(prev => ({ ...prev, [key]: value }));
    // In a real app, you would save these to the backend
    toast({
      title: "Settings Updated",
      description: `${key} has been updated`,
    });
  };

  const canManageUsers = user?.role === "admin";

  return (
    <Layout
      title="Settings"
      subtitle="Manage system configuration"
      showNewAuditButton={false}
    >
      <div className="space-y-6">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="zones">Zones & Teams</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  {canManageUsers && (
                    <Button onClick={() => setShowNewUserDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-slate-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead>Zones</TableHead>
                          <TableHead>Status</TableHead>
                          {canManageUsers && <TableHead>Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.map((userData: any) => (
                          <TableRow key={userData.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{userData.name}</p>
                                  <p className="text-sm text-slate-600">{userData.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getRoleColor(userData.role)}>
                                {userData.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-900">
                                {userData.team || "Not assigned"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {userData.zones?.slice(0, 2).map((zone: string) => (
                                  <Badge key={zone} variant="outline" className="text-xs">
                                    {zone}
                                  </Badge>
                                ))}
                                {userData.zones?.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{userData.zones.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={userData.isActive ? "default" : "secondary"}>
                                {userData.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            {canManageUsers && (
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedUser(userData)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Zones & Teams Tab */}
          <TabsContent value="zones" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Zones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {zones?.map((zone: any) => (
                      <div key={zone.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{zone.name}</p>
                          <p className="text-sm text-slate-600">{zone.description}</p>
                          <p className="text-xs text-slate-500">
                            {zone.type} • {zone.floor} Floor
                          </p>
                        </div>
                        <Badge variant={zone.isActive ? "default" : "secondary"}>
                          {zone.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teams?.map((team: any) => (
                      <div key={team.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{team.name}</p>
                          <p className="text-sm text-slate-600">Leader: {team.leader}</p>
                          <p className="text-xs text-slate-500">
                            {team.members?.length || 0} members
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {team.assignedZones?.slice(0, 2).map((zone: string) => (
                            <Badge key={zone} variant="outline" className="text-xs">
                              {zone}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="auditDuration">Default Audit Duration (minutes)</Label>
                    <Select
                      value={systemSettings.auditDuration.toString()}
                      onValueChange={(value) => handleSystemSettingsChange("auditDuration", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                        <SelectItem value="120">120 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reminderDays">Reminder Days Before Due</Label>
                    <Select
                      value={systemSettings.reminderDays.toString()}
                      onValueChange={(value) => handleSystemSettingsChange("reminderDays", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 day</SelectItem>
                        <SelectItem value="2">2 days</SelectItem>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="7">1 week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoAssignment">Auto Assignment</Label>
                      <p className="text-sm text-slate-600">
                        Automatically assign audits to teams based on zones
                      </p>
                    </div>
                    <Switch
                      id="autoAssignment"
                      checked={systemSettings.autoAssignment}
                      onCheckedChange={(checked) => handleSystemSettingsChange("autoAssignment", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-slate-400" />
                      <div>
                        <Label htmlFor="emailNotifications">Email Notifications</Label>
                        <p className="text-sm text-slate-600">
                          Receive audit reminders and updates via email
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={systemSettings.emailNotifications}
                      onCheckedChange={(checked) => handleSystemSettingsChange("emailNotifications", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-slate-400" />
                      <div>
                        <Label htmlFor="smsNotifications">SMS Notifications</Label>
                        <p className="text-sm text-slate-600">
                          Receive urgent alerts via SMS
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="smsNotifications"
                      checked={systemSettings.smsNotifications}
                      onCheckedChange={(checked) => handleSystemSettingsChange("smsNotifications", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New User Dialog */}
        <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newUserData.username}
                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newUserData.role}
                    onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auditor">Auditor</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      {user?.role === "admin" && (
                        <SelectItem value="admin">Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="team">Team</Label>
                  <Select
                    value={newUserData.team}
                    onValueChange={(value) => setNewUserData({ ...newUserData, team: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAMS.map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewUserDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        {selectedUser && (
          <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Username</Label>
                  <p className="text-sm text-slate-900">{selectedUser.username}</p>
                </div>
                <div>
                  <Label>Name</Label>
                  <p className="text-sm text-slate-900">{selectedUser.name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-slate-900">{selectedUser.email}</p>
                </div>
                <div>
                  <Label>Role</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Select
                      value={selectedUser.role}
                      onValueChange={(value) => handleUpdateUser({ role: value })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auditor">Auditor</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        {user?.role === "admin" && (
                          <SelectItem value="admin">Admin</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Select
                      value={selectedUser.isActive ? "active" : "inactive"}
                      onValueChange={(value) => handleUpdateUser({ isActive: value === "active" })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setSelectedUser(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}
