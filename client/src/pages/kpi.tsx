import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Layout from "@/components/layout/layout";

const kpis = [
  {
    id: 1,
    name: "Overall 5S Compliance",
    current: 87,
    target: 90,
    trend: "up",
    change: "+3%",
    category: "Compliance"
  },
  {
    id: 2,
    name: "Audit Completion Rate",
    current: 92,
    target: 95,
    trend: "up",
    change: "+5%",
    category: "Efficiency"
  },
  {
    id: 3,
    name: "Action Item Resolution",
    current: 78,
    target: 85,
    trend: "down",
    change: "-2%",
    category: "Quality"
  },
  {
    id: 4,
    name: "Training Completion",
    current: 95,
    target: 100,
    trend: "flat",
    change: "0%",
    category: "Development"
  },
  {
    id: 5,
    name: "Zone Certification",
    current: 70,
    target: 80,
    trend: "up",
    change: "+8%",
    category: "Compliance"
  },
  {
    id: 6,
    name: "Employee Engagement",
    current: 82,
    target: 85,
    trend: "up",
    change: "+4%",
    category: "Culture"
  }
];

export default function KPITracking() {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-slate-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-slate-600";
    }
  };

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Layout 
      title="KPI Tracking" 
      subtitle="Monitor key performance indicators"
      showHomeButton={true}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpis.map((kpi) => (
            <Card key={kpi.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{kpi.category}</Badge>
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{kpi.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Current</span>
                    <span className="font-medium">{kpi.current}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Target</span>
                    <span className="font-medium">{kpi.target}%</span>
                  </div>
                  <Progress 
                    value={kpi.current} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(kpi.trend)}
                      <span className={`text-sm font-medium ${getTrendColor(kpi.trend)}`}>
                        {kpi.change}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500">
                      {kpi.current >= kpi.target ? "Target Met" : `${kpi.target - kpi.current}% to go`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}