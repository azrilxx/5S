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
import { AlertTriangle, Calendar, User, MapPin, Edit2, Clock, CheckCircle, XCircle, AlertCircle, Filter, RefreshCw, Download, FileText, FileSpreadsheet, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(false);
  const [selectedActions, setSelectedActions] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

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
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(actionData),
      });
      if (!response.ok) throw new Error("Failed to update action");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      toast({ 
        title: "Action Updated",
        description: "The action has been successfully updated." 
      });
      setSelectedAction(null);
    },
    onError: () => {
      toast({ 
        title: "Update Failed",
        description: "Failed to update action. Please try again.",
        variant: "destructive" 
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (bulkData: { actionIds: number[], updates: any }) => {
      const response = await fetch("/api/actions/bulk", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(bulkData),
      });
      if (!response.ok) throw new Error("Failed to bulk update actions");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      toast({ 
        title: "Bulk Update Success",
        description: "Selected actions have been updated successfully." 
      });
      setSelectedActions([]);
      setShowBulkActions(false);
    },
    onError: () => {
      toast({ 
        title: "Bulk Update Failed",
        description: "Failed to update selected actions. Please try again.",
        variant: "destructive" 
      });
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

  const handleBulkUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedActions.length === 0) return;
    
    const formData = new FormData(e.currentTarget);
    const updates: any = {};
    
    const assignee = formData.get("bulkAssignee") as string;
    const status = formData.get("bulkStatus") as string;
    const priority = formData.get("bulkPriority") as string;
    const dueDate = formData.get("bulkDueDate") as string;
    
    if (assignee && assignee !== "no-change") updates.assignee = assignee;
    if (status && status !== "no-change") updates.status = status;
    if (priority && priority !== "no-change") updates.priority = priority;
    if (dueDate) updates.dueDate = dueDate;
    
    bulkUpdateMutation.mutate({ actionIds: selectedActions, updates });
  };

  const handleSelectAction = (actionId: number, checked: boolean) => {
    setSelectedActions(prev => 
      checked 
        ? [...prev, actionId]
        : prev.filter(id => id !== actionId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedActions(checked ? filteredActions.map(a => a.id) : []);
  };

  const prepareCSVData = () => {
    return filteredActions.map(action => ({
      'Action ID': action.id,
      'Title': action.title,
      'Description': action.description,
      'Assignee': action.assignee,
      'Zone': action.zone,
      'Priority': action.priority,
      'Status': action.status,
      'Due Date': new Date(action.dueDate).toLocaleDateString(),
      'Created At': new Date(action.createdAt).toLocaleDateString(),
      'Updated At': new Date(action.updatedAt).toLocaleDateString(),
    }));
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Action Tracker Report', 14, 22);
    
    // Add metadata
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);
    doc.text(`Total Actions: ${filteredActions.length}`, 14, 40);
    doc.text(`Filters Applied: ${showUnresolvedOnly ? 'Unresolved Only' : 'All Actions'}`, 14, 48);
    
    // Add table
    const tableData = filteredActions.map(action => [
      action.id,
      action.title.substring(0, 30) + (action.title.length > 30 ? '...' : ''),
      action.assignee,
      action.zone,
      action.priority,
      action.status,
      new Date(action.dueDate).toLocaleDateString(),
    ]);
    
    autoTable(doc, {
      head: [['ID', 'Title', 'Assignee', 'Zone', 'Priority', 'Status', 'Due Date']],
      body: tableData,
      startY: 55,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    doc.save(`Action_Tracker_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Export Success",
      description: "PDF report has been downloaded",
    });
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
    const matchesUnresolved = !showUnresolvedOnly || action.status !== "completed";
    
    return matchesSearch && matchesStatus && matchesPriority && matchesZone && matchesUnresolved;
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

      {/* Filters and Export */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
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
          <div className="flex items-center space-x-2">
            <Switch
              id="unresolved-only"
              checked={showUnresolvedOnly}
              onCheckedChange={setShowUnresolvedOnly}
            />
            <Label htmlFor="unresolved-only" className="text-sm font-medium">
              Show unresolved only
            </Label>
          </div>
        </div>
        
        {/* Export and Bulk Actions */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button onClick={handleExportPDF} variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <CSVLink
              data={prepareCSVData()}
              filename={`Action_Tracker_Report_${new Date().toISOString().split('T')[0]}.csv`}
            >
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CSVLink>
          </div>
          
          {user?.role === 'admin' && (
            <div className="flex items-center space-x-2">
              {selectedActions.length > 0 && (
                <Button
                  onClick={() => setShowBulkActions(true)}
                  variant="outline"
                  size="sm"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Bulk Actions ({selectedActions.length})
                </Button>
              )}
            </div>
          )}
        </div>
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
                  {user?.role === 'admin' && (
                    <th className="text-left p-3 w-12">
                      <Checkbox
                        checked={selectedActions.length === filteredActions.length && filteredActions.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                  )}
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
                    <td colSpan={user?.role === 'admin' ? 8 : 7} className="text-center p-8 text-gray-500">
                      No actions found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredActions.map((action) => (
                    <tr key={action.id} className="border-b hover:bg-gray-50">
                      {user?.role === 'admin' && (
                        <td className="p-3">
                          <Checkbox
                            checked={selectedActions.includes(action.id)}
                            onCheckedChange={(checked) => handleSelectAction(action.id, checked as boolean)}
                          />
                        </td>
                      )}
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

      {/* Bulk Actions Modal */}
      {showBulkActions && user?.role === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Bulk Update Actions ({selectedActions.length} selected)</CardTitle>
              <CardDescription>
                Update multiple actions at once. Leave fields unchanged to keep current values.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBulkUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bulkAssignee">Assignee</Label>
                    <Select name="bulkAssignee" defaultValue="no-change">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-change">No Change</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.name}>
                            {user.name} ({user.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bulkStatus">Status</Label>
                    <Select name="bulkStatus" defaultValue="no-change">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-change">No Change</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bulkPriority">Priority</Label>
                    <Select name="bulkPriority" defaultValue="no-change">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-change">No Change</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bulkDueDate">Due Date</Label>
                    <Input
                      id="bulkDueDate"
                      name="bulkDueDate"
                      type="date"
                      placeholder="Leave blank to keep current dates"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={bulkUpdateMutation.isPending}>
                    {bulkUpdateMutation.isPending ? "Updating..." : "Update Actions"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowBulkActions(false)}>
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