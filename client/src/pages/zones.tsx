import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Users, CheckCircle, Building, Layers, Plus } from "lucide-react";
import Layout from "@/components/layout/layout";
import { useState } from "react";

export default function Zones() {
  const [activeTab, setActiveTab] = useState("hierarchy");

  const { data: buildings, isLoading: buildingsLoading } = useQuery({
    queryKey: ["/api/buildings"],
  });

  const { data: floors, isLoading: floorsLoading } = useQuery({
    queryKey: ["/api/floors"],
  });

  const { data: zones, isLoading: zonesLoading } = useQuery({
    queryKey: ["/api/zones"],
  });

  const isLoading = buildingsLoading || floorsLoading || zonesLoading;

  // Group zones by building and floor for hierarchy view
  const buildingGroups = buildings?.reduce((acc: any, building: any) => {
    const buildingFloors = floors?.filter((floor: any) => floor.buildingId === building.id) || [];
    const floorsWithZones = buildingFloors.map((floor: any) => ({
      ...floor,
      zones: zones?.filter((zone: any) => zone.floorId === floor.id) || []
    }));
    
    acc[building.id] = {
      ...building,
      floors: floorsWithZones
    };
    return acc;
  }, {}) || {};

  const renderZoneCard = (zone: any) => (
    <Card key={zone.id} className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-slate-200/60 group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center text-slate-900 group-hover:text-primary transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center mr-3 group-hover:from-primary/20 group-hover:to-primary/30 transition-all">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            {zone.name}
          </CardTitle>
          <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-200 transition-colors shadow-sm">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600 font-medium leading-relaxed">{zone.description}</p>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-3 w-3 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Teams</p>
              <p className="text-sm font-bold text-slate-900">3</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Compliance</p>
              <p className="text-sm font-bold text-green-600">85%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout 
      title="Zone Management" 
      subtitle="Organize workplace zones with hierarchical building and floor structure"
      showHomeButton={true}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="hierarchy">Hierarchy View</TabsTrigger>
              <TabsTrigger value="buildings">Buildings</TabsTrigger>
              <TabsTrigger value="zones">All Zones</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Zone
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="hierarchy" className="space-y-8">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse border-slate-200/60">
                    <CardContent className="p-6">
                      <div className="h-40 bg-slate-200 rounded-lg"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              Object.values(buildingGroups).map((building: any) => (
                <Card key={building.id} className="border-slate-200/60 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold flex items-center text-slate-900">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                          <Building className="h-5 w-5 text-blue-600" />
                        </div>
                        {building.name}
                      </CardTitle>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {building.floors.length} floors
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 ml-13">{building.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {building.floors.map((floor: any) => (
                      <div key={floor.id} className="space-y-4">
                        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500/10 to-green-500/20 rounded-lg flex items-center justify-center">
                            <Layers className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{floor.name}</h4>
                            <p className="text-sm text-slate-600">{floor.description}</p>
                          </div>
                          <div className="flex-1"></div>
                          <Badge variant="secondary" className="bg-green-50 text-green-700">
                            {floor.zones.length} zones
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pl-11">
                          {floor.zones.map((zone: any) => renderZoneCard(zone))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="buildings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse border-slate-200/60">
                    <CardContent className="p-6">
                      <div className="h-32 bg-slate-200 rounded-lg"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                buildings?.map((building: any) => (
                  <Card key={building.id} className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-200/60 group">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold flex items-center text-slate-900 group-hover:text-primary transition-colors">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-blue-500/20 rounded-lg flex items-center justify-center mr-3 group-hover:from-blue-500/20 group-hover:to-blue-500/30 transition-all">
                            <Building className="h-5 w-5 text-blue-600" />
                          </div>
                          {building.name}
                        </CardTitle>
                        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-200 transition-colors shadow-sm">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">{building.description}</p>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Layers className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Floors</p>
                            <p className="text-sm font-bold text-slate-900">
                              {floors?.filter((floor: any) => floor.buildingId === building.id).length || 0}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Zones</p>
                            <p className="text-sm font-bold text-slate-900">
                              {zones?.filter((zone: any) => zone.buildingId === building.id).length || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="zones" className="space-y-6">
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
                zones?.map((zone: any) => renderZoneCard(zone))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}