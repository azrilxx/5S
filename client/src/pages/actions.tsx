import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Edit, Filter, Search, User, Calendar, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ZONES, TEAMS, PRIORITIES, ACTION_STATUS } from "@/lib/constants";
import { useAuth } from "@/components/auth/auth-provider";
import Layout from "@/components/layout/layout";

export default function Actions() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewActionDialog, setShowNewActionDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [newActionData, setNewActionData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    zone: "",
    priority: "medium",
    dueDate: "",
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: actions, isLoading } = useQuery({
    queryKey: ["/api/actions"],
  });

  // Filter actions based on user role
  const filteredActions = user?.role === 'admin' 
    ? (actions as any[]) || []
    : (actions as any[])?.filter((action: any) => action.assignedTo === user?.username) || [];

  const createActionMutation = useMutation({
    mutationFn: (actionData: any) => apiRequest("POST", "/api/actions", actionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      setShowNewActionDialog(false);
      setNewActionData({
        title: "",
        description: "",
        assignedTo: "",
        zone: "",
        priority: "medium",
        dueDate: "",
      });
      toast({
        title: "Success",
        description: "Action created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create action",
        variant: "destructive",
      });
    },
  });

  const updateActionMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      apiRequest("PUT", `/api/actions/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      setSelectedAction(null);
      toast({
        title: "Success",
        description: "Action updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update action",
        variant: "destructive",
      });
    },
  });

  const filteredData = filteredActions.filter((action: any) => {
    const matchesStatus = selectedStatus === "all" || action.status === selectedStatus;
    const matchesSearch = action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCreateAction = () => {
    if (!newActionData.title || !newActionData.assignedTo || !newActionData.zone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createActionMutation.mutate({
      ...newActionData,
      status: ACTION_STATUS.OPEN,
      dueDate: newActionData.dueDate ? new Date(newActionData.dueDate) : null,
    });
  };

  const handleUpdateAction = (updates: any) => {
    if (!selectedAction) return;
    
    updateActionMutation.mutate({
      id: selectedAction.id,
      updates,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case ACTION_STATUS.CLOSED:
        return "bg-green-100 text-green-800";
      case ACTION_STATUS.IN_PROGRESS:
        return "bg-yellow-100 text-yellow-800";
      case ACTION_STATUS.OPEN:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const isAdmin = user?.role === 'admin';
  const actionsTitle = isAdmin ? "All Corrective Actions" : "My Assigned Actions";
  const actionsSubtitle = isAdmin 
    ? "Manage all corrective actions from audits" 
    : "View and update your assigned corrective actions";

  return (
    <Layout
      title={actionsTitle}
      subtitle={actionsSubtitle}
      showNewAuditButton={false}
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filters</CardTitle>
              {isAdmin && (
                <Button onClick={() => setShowNewActionDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Action
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="search"
                    placeholder="Search actions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Label htmlFor="status">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-slate-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredActions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No actions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActions.map((action: any) => (
                      <TableRow key={action.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-3 ${
                              action.priority === 'high' ? 'bg-red-500' :
                              action.priority === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`} />
                            <div>
                              <p className="font-medium text-slate-900">{action.title}</p>
                              <p className="text-sm text-slate-500">{action.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-slate-400 mr-2" />
                            <span className="text-sm text-slate-900">{action.assignedTo}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-900">{action.zone}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(action.priority)}>
                            {action.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {action.dueDate && isOverdue(action.dueDate) && action.status !== 'closed' && (
                              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <span className={`text-sm ${
                              action.dueDate && isOverdue(action.dueDate) && action.status !== 'closed' 
                                ? 'text-red-600' 
                                : 'text-slate-600'
                            }`}>
                              {action.dueDate 
                                ? new Date(action.dueDate).toLocaleDateString()
                                : 'No due date'
                              }
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(action.status)}>
                            {action.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAction(action)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAction(action)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Action Dialog */}
        <Dialog open={showNewActionDialog} onOpenChange={setShowNewActionDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Action</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Action Title</Label>
                <Input
                  id="title"
                  value={newActionData.title}
                  onChange={(e) => setNewActionData({ ...newActionData, title: e.target.value })}
                  placeholder="Enter action title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newActionData.description}
                  onChange={(e) => setNewActionData({ ...newActionData, description: e.target.value })}
                  placeholder="Enter action description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Select
                    value={newActionData.assignedTo}
                    onValueChange={(value) => setNewActionData({ ...newActionData, assignedTo: value })}
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
                <div>
                  <Label htmlFor="zone">Zone</Label>
                  <Select
                    value={newActionData.zone}
                    onValueChange={(value) => setNewActionData({ ...newActionData, zone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {ZONES.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newActionData.priority}
                    onValueChange={(value) => setNewActionData({ ...newActionData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((priority) => (
                        <SelectItem key={priority} value={priority.toLowerCase()}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newActionData.dueDate}
                    onChange={(e) => setNewActionData({ ...newActionData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewActionDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAction} disabled={createActionMutation.isPending}>
                  {createActionMutation.isPending ? "Creating..." : "Create Action"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Action Details/Edit Dialog */}
        {selectedAction && (
          <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Action Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <p className="text-sm text-slate-900">{selectedAction.title}</p>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-slate-900">{selectedAction.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Assigned To</Label>
                    <p className="text-sm text-slate-900">{selectedAction.assignedTo}</p>
                  </div>
                  <div>
                    <Label>Zone</Label>
                    <p className="text-sm text-slate-900">{selectedAction.zone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Badge className={getPriorityColor(selectedAction.priority)}>
                      {selectedAction.priority}
                    </Badge>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <p className="text-sm text-slate-900">
                      {selectedAction.dueDate 
                        ? new Date(selectedAction.dueDate).toLocaleDateString()
                        : 'No due date'
                      }
                    </p>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Select
                      value={selectedAction.status}
                      onValueChange={(value) => handleUpdateAction({ status: value })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setSelectedAction(null)}>
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
