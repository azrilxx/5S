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
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse border-slate-200/60">
                <CardContent className="p-6">
                  <div className="h-32 bg-slate-200 rounded-lg"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            (zones as any[])?.map((zone: any) => (
              <Card key={zone.id} className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-200/60 group">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold flex items-center text-slate-900 group-hover:text-primary transition-colors">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center mr-3 group-hover:from-primary/20 group-hover:to-primary/30 transition-all">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      {zone.name}
                    </CardTitle>
                    <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-200 transition-colors shadow-sm">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{zone.description}</p>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Teams</p>
                        <p className="text-sm font-bold text-slate-900">5</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Compliance</p>
                        <p className="text-sm font-bold text-green-600">85%</p>
                      </div>
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