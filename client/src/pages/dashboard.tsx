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
import { useAuth } from "@/components/auth/auth-provider";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

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

  // Filter actions based on user role
  const filteredActions = user?.role === 'admin' 
    ? (actions as any[]) || []
    : (actions as any[])?.filter((action: any) => action.assignedTo === user?.username) || [];

  const pendingActions = filteredActions.filter((action: any) => 
    action.status === 'open' || action.status === 'in_progress'
  );

  const overdueActions = (actions as any[])?.filter((action: any) => {
    if (!action.dueDate) return false;
    return new Date(action.dueDate) < new Date() && action.status !== 'closed';
  }) || [];

  const isAdmin = user?.role === 'admin';
  const dashboardTitle = isAdmin ? "Admin Dashboard" : "My Dashboard";
  const dashboardSubtitle = isAdmin 
    ? "Monitor all 5S audit activities and manage system" 
    : "View your audit activities and assigned actions";

  return (
    <Layout
      title={dashboardTitle}
      subtitle={dashboardSubtitle}
      showNewAuditButton={true}
      onNewAudit={handleNewAudit}
    >
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all duration-300 border-slate-200/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Today's Audits</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {stats.todaysAudits || 0}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-sm">
                  <ClipboardCheck className="text-primary h-7 w-7" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-sm text-green-600 flex items-center font-medium">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  12% from yesterday
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-slate-200/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Pending Actions</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {stats.pendingActions || 0}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shadow-sm">
                  <AlertTriangle className="text-orange-600 h-7 w-7" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-sm text-orange-600 flex items-center font-medium">
                  <ArrowDown className="h-4 w-4 mr-1" />
                  {stats.overdueActions || 0} overdue
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-slate-200/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Compliance Rate</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {stats.complianceRate || 0}%
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center shadow-sm">
                  <CheckCircle className="text-green-600 h-7 w-7" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-sm text-green-600 flex items-center font-medium">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  5% improvement
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-slate-200/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Active Zones</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {stats.activeZones || 0}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center shadow-sm">
                  <MapPin className="text-purple-600 h-7 w-7" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-sm text-slate-600 flex items-center font-medium">
                  <Clock className="h-4 w-4 mr-1" />
                  Last updated 10 min ago
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Plan and Action Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-900">Today's Plan</CardTitle>
              <p className="text-sm text-slate-600 font-medium">Scheduled audits for today</p>
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

          <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-900">Action Items</CardTitle>
              <p className="text-sm text-slate-600 font-medium">Pending corrective actions</p>
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
        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-bold text-slate-900">5S Compliance Overview</CardTitle>
            <p className="text-sm text-slate-600 font-medium">Current status across all zones</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[
                { name: '1S - Sort', score: 92, color: 'bg-blue-500' },
                { name: '2S - Set in Order', score: 88, color: 'bg-green-500' },
                { name: '3S - Shine', score: 85, color: 'bg-yellow-500' },
                { name: '4S - Standardize', score: 90, color: 'bg-purple-500' },
                { name: '5S - Sustain', score: 82, color: 'bg-red-500' }
              ].map((item, index) => (
                <div key={index} className="text-center group hover:scale-105 transition-transform duration-200">
                  <div className="w-18 h-18 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                    <span className="text-2xl font-bold text-slate-700">{index + 1}S</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">{item.name}</h4>
                  <p className="text-2xl font-bold text-slate-900 mb-3">{item.score}%</p>
                  <div className="w-full bg-slate-200 rounded-full h-3 shadow-inner">
                    <div 
                      className={`${item.color} h-3 rounded-full transition-all duration-500 ease-out shadow-sm`}
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
