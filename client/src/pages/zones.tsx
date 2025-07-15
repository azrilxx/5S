import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, CheckCircle } from "lucide-react";
import Layout from "@/components/layout/layout";

export default function Zones() {
  const { data: zones, isLoading } = useQuery({
    queryKey: ["/api/zones"],
  });

  return (
    <Layout 
      title="Zones" 
      subtitle="Manage workplace zones and areas"
      showHomeButton={true}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-24 bg-slate-200 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            zones?.map((zone: any) => (
              <Card key={zone.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-primary" />
                      {zone.name}
                    </CardTitle>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">{zone.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-slate-500">
                      <Users className="h-4 w-4 mr-1" />
                      5 Teams
                    </div>
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      85% Compliance
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