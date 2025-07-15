import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, User, MapPin, Target } from "lucide-react";
import Layout from "@/components/layout/layout";

export default function Teams() {
  const { data: teams, isLoading } = useQuery({
    queryKey: ["/api/teams"],
  });

  return (
    <Layout 
      title="Teams" 
      subtitle="Manage audit teams and assignments"
      showHomeButton={true}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-slate-200 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            teams?.map((team: any) => (
              <Card key={team.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      {team.name}
                    </CardTitle>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">{team.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-slate-500">
                      <User className="h-4 w-4 mr-2" />
                      {team.members || 8} Members
                    </div>
                    <div className="flex items-center text-sm text-slate-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      {team.zone || "Multiple Zones"}
                    </div>
                    <div className="flex items-center text-sm text-green-600">
                      <Target className="h-4 w-4 mr-2" />
                      92% Performance
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}