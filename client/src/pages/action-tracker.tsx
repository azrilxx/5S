import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/components/auth/auth-provider";
import { AlertTriangle, Calendar, User, MapPin, Edit2, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Action {
  id: number;
  title: string;
  description: string;
  assignee: string;
  zone: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "completed" | "overdue";
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  username: string;
  name: string;
  team: string | null;
}

interface Zone {
  id: number;
  name: string;
  type: string;
}

export default function ActionTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");

  const { data: actions = [], isLoading: actionsLoading } = useQuery<Action[]>({
    queryKey: ["/api/actions"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: user?.role === 'admin',
  });

  const { data: zones = [], isLoading: zonesLoading } = useQuery<Zone[]>({
    queryKey: ["/api/zones"],
    enabled: user?.role === 'admin',
  });

  const updateActionMutation = useMutation({
    mutationFn: async (actionData: Action) => {
      const response = await fetch(`/api/actions/${actionData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(actionData),
      });
      if (!response.ok) throw new Error("Failed to update action");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      toast({ title: "Action updated successfully" });
      setSelectedAction(null);
    },
    onError: () => {
      toast({ title: "Failed to update action", variant: "destructive" });
    },
  });

  const handleUpdateAction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAction) return;
    
    const formData = new FormData(e.currentTarget);
    const actionData = {
      ...selectedAction,
      assignee: formData.get("assignee") as string,
      zone: formData.get("zone") as string,
      priority: formData.get("priority") as Action["priority"],
      status: formData.get("status") as Action["status"],
      dueDate: formData.get("dueDate") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
    };
    
    updateActionMutation.mutate(actionData);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "pending": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in_progress": return <Clock className="w-4 h-4 text-blue-600" />;
      case "overdue": return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending": return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && selectedAction?.status !== "completed";
  };

  const filteredActions = actions.filter(action => {
    const matchesSearch = action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.assignee.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || action.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || action.priority === priorityFilter;
    const matchesZone = zoneFilter === "all" || action.zone === zoneFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesZone;
  });

  const openActions = actions.filter(action => action.status !== "completed");
  const overdueActions = actions.filter(action => isOverdue(action.dueDate));

  if (actionsLoading || usersLoading || zonesLoading) {
    return <div className="p-6">Loading action tracker...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Action Tracker</h1>
        <p className="text-gray-600">
          Monitor and manage corrective actions across all zones
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Actions</p>
                <p className="text-2xl font-bold text-gray-900">{actions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Open Actions</p>
                <p className="text-2xl font-bold text-gray-900">{openActions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{overdueActions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {actions.filter(a => a.status === "completed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <Input
          placeholder="Search actions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={zoneFilter} onValueChange={setZoneFilter}>
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Filter by zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Zones</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone.id} value={zone.name}>
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Actions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Actions ({filteredActions.length})</CardTitle>
          <CardDescription>
            All corrective actions across zones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Action</th>
                  <th className="text-left p-3">Assignee</th>
                  <th className="text-left p-3">Zone</th>
                  <th className="text-left p-3">Priority</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Due Date</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-gray-500">
                      No actions found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredActions.map((action) => (
                    <tr key={action.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{action.title}</div>
                          <div className="text-sm text-gray-600 truncate max-w-xs">
                            {action.description}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{action.assignee}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{action.zone}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={getPriorityColor(action.priority)}>
                          {action.priority}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(action.status)}
                          <Badge className={getStatusColor(action.status)}>
                            {action.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className={isOverdue(action.dueDate) ? "text-red-600" : ""}>
                            {new Date(action.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        {user?.role === 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAction(action)}
                            title="Edit action"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Action Modal */}
      {selectedAction && user?.role === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Edit Action</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateAction} className="space-y-4">
                <div>
                  <Label htmlFor="title">Action Title</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={selectedAction.title}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={selectedAction.description}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assignee">Assignee</Label>
                    <Select name="assignee" defaultValue={selectedAction.assignee}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.name}>
                            {user.name} ({user.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="zone">Zone</Label>
                    <Select name="zone" defaultValue={selectedAction.zone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.name}>
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue={selectedAction.priority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={selectedAction.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    defaultValue={selectedAction.dueDate.split('T')[0]}
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={updateActionMutation.isPending}>
                    {updateActionMutation.isPending ? "Updating..." : "Update Action"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setSelectedAction(null)}>
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