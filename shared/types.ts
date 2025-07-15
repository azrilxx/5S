export interface ActionItem {
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
  assignedBy?: string;
}

export interface AuditReport {
  id: number;
  title: string;
  type: string;
  generatedBy: string;
  generatedAt: string;
  metadata: Record<string, any>;
  fileUrl?: string;
}

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  team?: string;
  isActive: boolean;
}

export interface Zone {
  id: number;
  name: string;
  description: string;
  buildingId: number;
  floorId: number;
  type: string;
}

export interface BulkUpdateRequest {
  actionIds: number[];
  updates: {
    assignee?: string;
    status?: ActionItem['status'];
    priority?: ActionItem['priority'];
    dueDate?: string;
    zone?: string;
  };
}

export interface ExportOptions {
  format: 'csv' | 'pdf';
  filters: {
    status?: string;
    priority?: string;
    zone?: string;
    assignee?: string;
    unresolvedOnly?: boolean;
  };
}