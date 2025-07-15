import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Download, FileText, Eye, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ZONES } from "@/lib/constants";
import { useAuth } from "@/components/auth/auth-provider";
import Layout from "@/components/layout/layout";

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30");
  const [selectedZone, setSelectedZone] = useState<string>("all");

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/reports"],
  });

  const { data: audits } = useQuery({
    queryKey: ["/api/audits"],
  });

  const { data: actions } = useQuery({
    queryKey: ["/api/actions"],
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const generateReportMutation = useMutation({
    mutationFn: (reportData: any) => apiRequest("POST", "/api/reports", reportData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Success",
        description: "Report generated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    },
  });

  // Generate compliance trend data
  const generateComplianceTrend = () => {
    const completed = (audits as any[])?.filter((audit: any) => audit.status === 'completed') || [];
    const monthlyData = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      // Calculate compliance for this month (mock calculation)
      const baseCompliance = 80 + (Math.random() * 20);
      monthlyData.push({
        month: monthName,
        compliance: Math.round(baseCompliance),
        audits: Math.floor(Math.random() * 15) + 5,
      });
    }
    
    return monthlyData;
  };

  // Generate zone performance data
  const generateZonePerformance = () => {
    return ZONES.map((zone) => {
      const zoneAudits = (audits as any[])?.filter((audit: any) => audit.zone === zone) || [];
      const completedAudits = zoneAudits.filter((audit: any) => audit.status === 'completed');
      const compliance = zoneAudits.length > 0 ? (completedAudits.length / zoneAudits.length) * 100 : 0;
      
      return {
        zone: zone.replace(' ', '\n'),
        compliance: Math.round(compliance),
        audits: zoneAudits.length,
      };
    });
  };

  // Generate 5S category performance
  const generate5SPerformance = () => {
    return [
      { category: '1S - Sort', score: 92, trend: 'up' },
      { category: '2S - Set in Order', score: 88, trend: 'up' },
      { category: '3S - Shine', score: 85, trend: 'down' },
      { category: '4S - Standardize', score: 90, trend: 'up' },
      { category: '5S - Sustain', score: 82, trend: 'down' },
    ];
  };

  const handleGenerateReport = async () => {
    const reportData = {
      title: `5S Compliance Report - ${new Date().toLocaleDateString()}`,
      type: "compliance",
      format: "pdf",
      metadata: {
        period: selectedPeriod,
        zone: selectedZone,
        generatedAt: new Date().toISOString(),
      },
    };

    generateReportMutation.mutate(reportData);
  };

  const complianceTrend = generateComplianceTrend();
  const zonePerformance = generateZonePerformance();
  const categoryPerformance = generate5SPerformance();

  return (
    <Layout
      title="Reports & Analytics"
      subtitle="View audit trends and compliance metrics"
      showNewAuditButton={false}
    >
      <div className="space-y-8">
        {/* Report Controls */}
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-slate-900">Report Generation</CardTitle>
              <div className="flex items-center space-x-3">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="180">Last 6 months</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger className="w-48">
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
                <Button onClick={handleGenerateReport} disabled={generateReportMutation.isPending}>
                  <Download className="h-4 w-4 mr-2" />
                  {generateReportMutation.isPending ? "Generating..." : "Export PDF"}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Compliance Trend */}
          <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-900">Compliance Trends</CardTitle>
              <p className="text-sm text-slate-600 font-medium">Overall 5S compliance over time</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={complianceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="compliance" 
                      stroke="hsl(207, 90%, 54%)" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(207, 90%, 54%)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    {(dashboardStats as any)?.complianceRate || 87}% average compliance
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zone Performance */}
          <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-900">Zone Performance</CardTitle>
              <p className="text-sm text-slate-600 font-medium">Compliance by zone comparison</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={zonePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="zone" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="compliance" fill="hsl(207, 90%, 54%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 5S Category Performance */}
        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-bold text-slate-900">5S Category Performance</CardTitle>
            <p className="text-sm text-slate-600 font-medium">Detailed breakdown by 5S category</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {categoryPerformance.map((category, index) => (
                <div key={index} className="text-center group hover:scale-105 transition-transform duration-200">
                  <div className="w-18 h-18 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                    <span className="text-xl font-bold text-slate-700">{index + 1}S</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 leading-tight">{category.category}</h4>
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <p className="text-2xl font-bold text-slate-900">{category.score}%</p>
                    {category.trend === 'up' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <Progress value={category.score} className="h-3 shadow-inner" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Audits</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {(audits as any[])?.length || 0}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-sm">
                  <Activity className="text-primary h-7 w-7" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-sm text-slate-600 font-medium">
                  {(audits as any[])?.filter((audit: any) => audit.status === 'completed').length || 0} completed
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Action Items</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {(actions as any[])?.length || 0}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shadow-sm">
                  <FileText className="text-orange-600 h-7 w-7" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-sm text-slate-600 font-medium">
                  {(actions as any[])?.filter((action: any) => action.status === 'closed').length || 0} resolved
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Improvement Rate</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">+15%</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center shadow-sm">
                  <TrendingUp className="text-green-600 h-7 w-7" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-sm text-green-600 font-medium">
                  Month over month
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generated Reports */}
        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-bold text-slate-900">Generated Reports</CardTitle>
            <p className="text-sm text-slate-600 font-medium">Recent audit reports</p>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-slate-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (reports as any[])?.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">No reports generated yet</p>
                <p className="text-sm text-slate-400">
                  Generate your first report using the Export PDF button above
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {(reports as any[])?.map((report: any) => (
                  <div key={report.id} className="py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <FileText className="text-red-600 h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-slate-900">{report.title}</p>
                          <p className="text-xs text-slate-600">
                            Generated on {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {report.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {report.format.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
