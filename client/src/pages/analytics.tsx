import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, PieChart } from "lucide-react";
import Layout from "@/components/layout/layout";

export default function Analytics() {
  return (
    <Layout 
      title="Analytics" 
      subtitle="Advanced analytics and performance insights"
      showHomeButton={true}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Audit Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">92%</div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-xs text-slate-500">+5% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">4.2</div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-xs text-slate-500">+0.3 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Action Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">23</div>
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-xs text-slate-500">-12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Zones Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">8/10</div>
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-xs text-slate-500">80% compliance rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Monthly Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-slate-500">
                Chart placeholder - Monthly audit trends
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Zone Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-slate-500">
                Chart placeholder - Zone performance distribution
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}