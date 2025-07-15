import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Filter, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ZONES, FIVE_S_QUESTIONS, AUDIT_STATUS } from "@/lib/constants";
import { useAuth } from "@/components/auth/auth-provider";
import Layout from "@/components/layout/layout";
import AuditForm from "@/components/audit/audit-form";

export default function Audits() {
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewAuditDialog, setShowNewAuditDialog] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [newAuditData, setNewAuditData] = useState({
    title: "",
    zone: "",
    scheduledDate: "",
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: audits, isLoading } = useQuery({
    queryKey: ["/api/audits"],
  });

  const { data: zones } = useQuery({
    queryKey: ["/api/zones"],
  });

  const createAuditMutation = useMutation({
    mutationFn: (auditData: any) => apiRequest("POST", "/api/audits", auditData),
    onSuccess: async (response) => {
      const newAudit = await response.json();
      
      // Create checklist items for the new audit
      const checklistPromises = Object.entries(FIVE_S_QUESTIONS).flatMap(([category, questions]) =>
        questions.map((question, index) =>
          apiRequest("POST", "/api/checklist-items", {
            auditId: newAudit.id,
            category,
            question,
            order: index,
          })
        )
      );

      await Promise.all(checklistPromises);
      
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      setShowNewAuditDialog(false);
      setNewAuditData({ title: "", zone: "", scheduledDate: "" });
      
      toast({
        title: "Success",
        description: "Audit created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create audit",
        variant: "destructive",
      });
    },
  });

  const { data: selectedAuditItems } = useQuery({
    queryKey: ["/api/audits", selectedAudit?.id, "checklist-items"],
    enabled: !!selectedAudit,
  });

  const filteredAudits = audits?.filter((audit: any) => {
    const matchesZone = selectedZone === "all" || audit.zone === selectedZone;
    const matchesSearch = audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.zone.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesZone && matchesSearch;
  }) || [];

  const handleCreateAudit = () => {
    if (!newAuditData.title || !newAuditData.zone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createAuditMutation.mutate({
      ...newAuditData,
      status: AUDIT_STATUS.SCHEDULED,
      scheduledDate: newAuditData.scheduledDate ? new Date(newAuditData.scheduledDate) : new Date(),
    });
  };

  const handleStartAudit = (audit: any) => {
    setSelectedAudit(audit);
    // Update audit status to in_progress
    apiRequest("PUT", `/api/audits/${audit.id}`, { 
      status: AUDIT_STATUS.IN_PROGRESS,
      startedAt: new Date()
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case AUDIT_STATUS.COMPLETED:
        return "bg-green-100 text-green-800";
      case AUDIT_STATUS.IN_PROGRESS:
        return "bg-yellow-100 text-yellow-800";
      case AUDIT_STATUS.SCHEDULED:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (selectedAudit && selectedAuditItems) {
    return (
      <Layout
        title="Audit Execution"
        subtitle="Complete your 5S audit"
        showNewAuditButton={false}
      >
        <AuditForm
          audit={selectedAudit}
          checklistItems={selectedAuditItems}
          onClose={() => setSelectedAudit(null)}
        />
      </Layout>
    );
  }

  return (
    <Layout
      title="5S Audits"
      subtitle="Manage and execute 5S audits"
      onNewAudit={() => setShowNewAuditDialog(true)}
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="search"
                    placeholder="Search audits..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Label htmlFor="zone">Zone</Label>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Zones</SelectItem>
                    {ZONES.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audits List */}
        <Card>
          <CardHeader>
            <CardTitle>Audits</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-slate-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredAudits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No audits found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAudits.map((audit: any) => (
                  <div key={audit.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{audit.title}</h3>
                      <p className="text-sm text-slate-600">{audit.zone}</p>
                      <p className="text-xs text-slate-500">
                        Scheduled: {audit.scheduledDate ? new Date(audit.scheduledDate).toLocaleString() : 'Not scheduled'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(audit.status)}>
                        {audit.status}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartAudit(audit)}
                        >
                          {audit.status === AUDIT_STATUS.IN_PROGRESS ? 'Continue' : 'Start'}
                        </Button>
                        {audit.status === AUDIT_STATUS.COMPLETED && (
                          <Button variant="outline" size="sm">
                            View Report
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Audit Dialog */}
        <Dialog open={showNewAuditDialog} onOpenChange={setShowNewAuditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Audit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Audit Title</Label>
                <Input
                  id="title"
                  value={newAuditData.title}
                  onChange={(e) => setNewAuditData({ ...newAuditData, title: e.target.value })}
                  placeholder="Enter audit title"
                />
              </div>
              <div>
                <Label htmlFor="zone">Zone</Label>
                <Select
                  value={newAuditData.zone}
                  onValueChange={(value) => setNewAuditData({ ...newAuditData, zone: value })}
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
              <div>
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={newAuditData.scheduledDate}
                  onChange={(e) => setNewAuditData({ ...newAuditData, scheduledDate: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewAuditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAudit} disabled={createAuditMutation.isPending}>
                  {createAuditMutation.isPending ? "Creating..." : "Create Audit"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
