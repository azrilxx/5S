import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Save, CheckCircle, X, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Audit, ChecklistItem } from "@shared/schema";
import { FIVE_S_CATEGORIES, FIVE_S_QUESTIONS } from "@/lib/constants";
import ChecklistItemComponent from "./checklist-item";

interface AuditFormProps {
  audit: Audit;
  checklistItems: ChecklistItem[];
  onClose: () => void;
}

export default function AuditForm({ audit, checklistItems, onClose }: AuditFormProps) {
  const [items, setItems] = useState<ChecklistItem[]>(checklistItems);
  const [activeTab, setActiveTab] = useState("1S");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateAuditMutation = useMutation({
    mutationFn: (updates: Partial<Audit>) =>
      apiRequest("PUT", `/api/audits/${audit.id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      toast({
        title: "Success",
        description: "Audit updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update audit",
        variant: "destructive",
      });
    },
  });

  const updateChecklistItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<ChecklistItem> }) =>
      apiRequest("PUT", `/api/checklist-items/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiRequest("POST", "/api/upload", formData);
      return response.json();
    },
  });

  const handleItemUpdate = (id: number, updates: Partial<ChecklistItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    updateChecklistItemMutation.mutate({ id, updates });
  };

  const handlePhotoUpload = async (file: File): Promise<string> => {
    const result = await uploadPhotoMutation.mutateAsync(file);
    return result.fileUrl;
  };

  const handleSaveDraft = () => {
    updateAuditMutation.mutate({ status: "draft" });
  };

  const handleCompleteAudit = () => {
    const completedItems = items.filter(item => item.response).length;
    const totalItems = items.length;
    const score = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    updateAuditMutation.mutate({ 
      status: "completed", 
      completedAt: new Date(),
      overallScore: score
    });
    onClose();
  };

  const deleteAuditMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/audits/${audit.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      setShowCancelDialog(false);
      onClose();
      
      toast({
        title: "Audit Deleted",
        description: "The audit has been completely removed from the system.",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete audit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCancelAudit = () => {
    deleteAuditMutation.mutate();
  };

  const getItemsByCategory = (category: string) => {
    return items.filter(item => item.category === category);
  };

  const getProgress = () => {
    const completedItems = items.filter(item => item.response).length;
    return items.length > 0 ? (completedItems / items.length) * 100 : 0;
  };

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-slate-900">
              {audit.zone} - 5S Audit
            </h4>
            <p className="text-sm text-slate-600">
              Started: {audit.startedAt ? new Date(audit.startedAt).toLocaleString() : "Not started"} | 
              Auditor: {audit.auditor}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={audit.status === "completed" ? "default" : "secondary"}>
              {audit.status === "in_progress" ? "In Progress" : audit.status}
            </Badge>
            
            {/* Cancel Button with Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={updateAuditMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Cancel Audit Session
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel this audit session? This will permanently delete the audit 
                    and all associated checklist items. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCancelDialog(false)}
                  >
                    Keep Working
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelAudit}
                    disabled={deleteAuditMutation.isPending}
                  >
                    {deleteAuditMutation.isPending ? "Deleting..." : "Yes, Delete Audit"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={updateAuditMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button 
              onClick={handleCompleteAudit}
              disabled={updateAuditMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Audit
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(getProgress())}% completed</span>
          </div>
          <Progress value={getProgress()} className="h-2" />
        </div>

        {/* 5S Categories Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            {Object.entries(FIVE_S_CATEGORIES).map(([key, name]) => (
              <TabsTrigger key={key} value={key}>
                {key} - {name}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(FIVE_S_CATEGORIES).map(([key, name]) => (
            <TabsContent key={key} value={key} className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-900 mb-4">
                  {key} - {name}
                </h3>
                {getItemsByCategory(key).map(item => (
                  <ChecklistItemComponent
                    key={item.id}
                    item={item}
                    onUpdate={handleItemUpdate}
                    onPhotoUpload={handlePhotoUpload}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
