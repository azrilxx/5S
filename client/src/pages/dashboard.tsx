import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ClipboardCheck, 
  AlertTriangle, 
  CheckCircle, 
  MapPin,
  ArrowUp,
  ArrowDown,
  Clock,
  Building,
  Factory,
  Users,
  TrendingUp
} from "lucide-react";
import Layout from "@/components/layout/layout";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: audits } = useQuery({
    queryKey: ["/api/audits"],
  });

  const { data: actions } = useQuery({
    queryKey: ["/api/actions"],
  });

  const handleNewAudit = () => {
    setLocation("/audits");
  };

  if (isLoading) {
    return (
      <Layout
        title="Dashboard"
        subtitle="Monitor your 5S audit activities"
        showNewAuditButton={true}
        onNewAudit={handleNewAudit}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-12 bg-slate-200 rounded mb-4"></div>
                  <div className="h-6 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const stats = (dashboardStats as any) || {};
  const todayAudits = (audits as any[])?.filter((audit: any) => {
    const today = new Date().toISOString().split('T')[0];
    const auditDate = audit.scheduledDate ? new Date(audit.scheduledDate).toISOString().split('T')[0] : null;
    return auditDate === today;
  }) || [];

  const pendingActions = (actions as any[])?.filter((action: any) => 
    action.status === 'open' || action.status === 'in_progress'
  ) || [];

  const overdueActions = (actions as any[])?.filter((action: any) => {
    if (!action.dueDate) return false;
    return new Date(action.dueDate) < new Date() && action.status !== 'closed';
  }) || [];

  return (
    <Layout
      title="Dashboard"
      subtitle="Monitor your 5S audit activities"
      showNewAuditButton={true}
      onNewAudit={handleNewAudit}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Today's Audits</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {stats.todaysAudits || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ClipboardCheck className="text-primary h-6 w-6" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600 flex items-center">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  12% from yesterday
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pending Actions</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {stats.pendingActions || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-orange-600 h-6 w-6" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-orange-600 flex items-center">
                  <ArrowDown className="h-4 w-4 mr-1" />
                  {stats.overdueActions || 0} overdue
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Compliance Rate</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {stats.complianceRate || 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-green-600 h-6 w-6" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  5% improvement
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active Zones</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {stats.activeZones || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MapPin className="text-purple-600 h-6 w-6" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-slate-600 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Last updated 10 min ago
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Plan and Action Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Plan</CardTitle>
              <p className="text-sm text-slate-600">Scheduled audits for today</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAudits.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">
                    No audits scheduled for today
                  </p>
                ) : (
                  todayAudits.map((audit: any) => (
                    <div key={audit.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {audit.zone.includes('Factory') ? (
                            <Factory className="text-primary h-5 w-5" />
                          ) : (
                            <Building className="text-green-600 h-5 w-5" />
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-slate-900">{audit.zone}</p>
                          <p className="text-xs text-slate-600">
                            {audit.scheduledDate ? new Date(audit.scheduledDate).toLocaleTimeString() : 'Time TBD'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={audit.status === 'completed' ? 'default' : 'secondary'}>
                          {audit.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          {audit.status === 'in_progress' ? 'Continue' : 'Start'}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Action Items</CardTitle>
              <p className="text-sm text-slate-600">Pending corrective actions</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingActions.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">
                    No pending actions
                  </p>
                ) : (
                  pendingActions.slice(0, 3).map((action: any) => (
                    <div key={action.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${
                          action.priority === 'high' ? 'bg-red-500' : 
                          action.priority === 'medium' ? 'bg-orange-500' : 
                          'bg-green-500'
                        }`}></div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-slate-900">{action.title}</p>
                          <p className="text-xs text-slate-600">Assigned to: {action.assignedTo}</p>
                          <p className={`text-xs ${
                            overdueActions.find(a => a.id === action.id) ? 'text-red-600' : 
                            'text-slate-500'
                          }`}>
                            Due: {action.dueDate ? new Date(action.dueDate).toLocaleDateString() : 'No due date'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        action.priority === 'high' ? 'destructive' : 
                        action.priority === 'medium' ? 'secondary' : 
                        'default'
                      }>
                        {action.priority}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 5S Compliance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>5S Compliance Overview</CardTitle>
            <p className="text-sm text-slate-600">Current status across all zones</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { name: '1S - Sort', score: 92, color: 'bg-blue-500' },
                { name: '2S - Set in Order', score: 88, color: 'bg-green-500' },
                { name: '3S - Shine', score: 85, color: 'bg-yellow-500' },
                { name: '4S - Standardize', score: 90, color: 'bg-purple-500' },
                { name: '5S - Sustain', score: 82, color: 'bg-red-500' }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-slate-700">{index + 1}S</span>
                  </div>
                  <h4 className="text-sm font-medium text-slate-900">{item.name}</h4>
                  <p className="text-2xl font-semibold text-slate-900 mt-1">{item.score}%</p>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                    <div 
                      className={`${item.color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
