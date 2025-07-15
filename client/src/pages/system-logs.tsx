import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/auth/auth-provider";
import { FileText, Shield, AlertCircle, CheckCircle, XCircle, Search, Download, Filter } from "lucide-react";

interface AuditLog {
  timestamp: string;
  event: string;
  userId?: number;
  username?: string;
  ip: string;
  userAgent: string;
  success: boolean;
  details?: any;
}

export default function SystemLogs() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: auditLogs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
    enabled: user?.role === 'admin',
  });

  const getEventColor = (event: string) => {
    switch (event) {
      case "LOGIN_ATTEMPT": return "bg-blue-100 text-blue-800";
      case "LOGOUT": return "bg-gray-100 text-gray-800";
      case "PASSWORD_CHANGE": return "bg-green-100 text-green-800";
      case "USER_CREATED": return "bg-purple-100 text-purple-800";
      case "USER_UPDATED": return "bg-yellow-100 text-yellow-800";
      case "AUDIT_CREATED": return "bg-indigo-100 text-indigo-800";
      case "ACTION_CREATED": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> : 
      <XCircle className="w-4 h-4 text-red-600" />;
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.ip.includes(searchTerm);
    const matchesEvent = eventFilter === "all" || log.event === eventFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "success" && log.success) ||
                         (statusFilter === "failure" && !log.success);
    return matchesSearch && matchesEvent && matchesStatus;
  });

  const exportLogs = () => {
    const csv = [
      ["Timestamp", "Event", "Username", "IP", "Success", "Details"],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.event,
        log.username || "N/A",
        log.ip,
        log.success ? "Success" : "Failure",
        JSON.stringify(log.details || {})
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="p-6">Loading system logs...</div>;
  }

  // Only admins can access this page
  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access system logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">System Audit Logs</h1>
        <p className="text-gray-600">
          Monitor system security events and user activity across the 5S audit platform
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-sm"
            />
          </div>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="LOGIN_ATTEMPT">Login Attempts</SelectItem>
              <SelectItem value="LOGOUT">Logout</SelectItem>
              <SelectItem value="PASSWORD_CHANGE">Password Changes</SelectItem>
              <SelectItem value="USER_CREATED">User Created</SelectItem>
              <SelectItem value="USER_UPDATED">User Updated</SelectItem>
              <SelectItem value="AUDIT_CREATED">Audit Created</SelectItem>
              <SelectItem value="ACTION_CREATED">Action Created</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failure">Failure</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={exportLogs} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{auditLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-gray-900">
                  {auditLogs.filter(log => log.success).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {auditLogs.filter(log => !log.success).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Filtered</p>
                <p className="text-2xl font-bold text-gray-900">{filteredLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Events ({filteredLogs.length})</CardTitle>
          <CardDescription>
            Real-time security and activity monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Timestamp</th>
                  <th className="text-left p-3">Event</th>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">IP Address</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-gray-500">
                      No audit logs found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <Badge className={getEventColor(log.event)}>
                          {log.event.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {log.username ? (
                          <span className="font-medium">{log.username}</span>
                        ) : (
                          <span className="text-gray-400">System</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-sm">{log.ip}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.success)}
                          <span className={log.success ? "text-green-600" : "text-red-600"}>
                            {log.success ? "Success" : "Failure"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600 max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}