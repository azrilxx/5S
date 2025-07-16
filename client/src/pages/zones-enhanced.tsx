import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { MapPin, Building, Users, ClipboardList, Edit2, Plus, Trash2, Shield } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

interface Zone {
  id: number;
  name: string;
  description: string;
  type: string;
  floor: string;
  building?: string;
  assignedTeams: string[];
  totalAudits: number;
  lastAudit: string;
  complianceScore: number;
  isActive: boolean;
}

interface Team {
  id: number;
  name: string;
  leader: string;
  members: string[];
}

export default function ZonesEnhanced() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: zones = [], isLoading: zonesLoading } = useQuery<Zone[]>({
    queryKey: ["/api/zones"],
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const createZoneMutation = useMutation({
    mutationFn: async (zoneData: Omit<Zone, "id" | "totalAudits" | "lastAudit" | "complianceScore">) => {
      const response = await fetch("/api/zones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(zoneData),
      });
      if (!response.ok) throw new Error("Failed to create zone");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
      toast({ title: "Zone created successfully" });
      setShowCreateForm(false);
    },
    onError: () => {
      toast({ title: "Failed to create zone", variant: "destructive" });
    },
  });

  const updateZoneMutation = useMutation({
    mutationFn: async (zoneData: Zone) => {
      const response = await fetch(`/api/zones/${zoneData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(zoneData),
      });
      if (!response.ok) throw new Error("Failed to update zone");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
      toast({ title: "Zone updated successfully" });
      setEditingZone(null);
    },
    onError: () => {
      toast({ title: "Failed to update zone", variant: "destructive" });
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: async (zoneId: number) => {
      const response = await fetch(`/api/zones/${zoneId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete zone");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
      toast({ title: "Zone deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete zone", variant: "destructive" });
    },
  });

  const handleCreateZone = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const assignedTeams = Array.from(formData.getAll("assignedTeams")) as string[];
    
    const zoneData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      type: formData.get("type") as string,
      floor: formData.get("floor") as string,
      building: formData.get("building") as string,
      assignedTeams,
      isActive: formData.get("isActive") === "on",
    };
    
    createZoneMutation.mutate(zoneData);
  };

  const handleUpdateZone = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingZone) return;
    
    const formData = new FormData(e.currentTarget);
    const assignedTeams = Array.from(formData.getAll("assignedTeams")) as string[];
    
    const zoneData = {
      ...editingZone,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      type: formData.get("type") as string,
      floor: formData.get("floor") as string,
      building: formData.get("building") as string,
      assignedTeams,
      isActive: formData.get("isActive") === "on",
    };
    
    updateZoneMutation.mutate(zoneData);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "factory": return "bg-blue-100 text-blue-800";
      case "office": return "bg-green-100 text-green-800";
      case "storage": return "bg-yellow-100 text-yellow-800";
      case "maintenance": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const buildings = [...new Set(zones.map(z => z.building).filter((building): building is string => Boolean(building)))];
  const types = [...new Set(zones.map(z => z.type))];

  const filteredZones = zones.filter(zone => {
    const matchesBuilding = selectedBuilding === "all" || zone.building === selectedBuilding;
    const matchesType = selectedType === "all" || zone.type === selectedType;
    return matchesBuilding && matchesType;
  });

  if (zonesLoading || teamsLoading) {
    return <div className="p-6">Loading zones...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Zones Management</h1>
        <p className="text-gray-600">
          Manage and monitor audit zones across your facility
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4">
          <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Filter by building" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buildings</SelectItem>
              {buildings.map((building) => (
                <SelectItem key={building} value={building}>
                  {building}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {user?.role === "admin" && (
          <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Zone
          </Button>
        )}
      </div>

      {/* Create Zone Form */}
      {showCreateForm && user?.role === "admin" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Zone</CardTitle>
            <CardDescription>
              Add a new zone to your facility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateZone} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Zone Name</Label>
                  <Input id="name" name="name" required placeholder="Enter zone name..." />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="factory">Factory</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Zone description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="building">Building</Label>
                  <Input id="building" name="building" placeholder="Building name..." />
                </div>
                <div>
                  <Label htmlFor="floor">Floor</Label>
                  <Input id="floor" name="floor" placeholder="Floor level..." />
                </div>
              </div>
              <div>
                <Label>Assigned Teams</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {teams.map((team) => (
                    <div key={team.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`team-${team.id}`}
                        name="assignedTeams"
                        value={team.name}
                      />
                      <Label htmlFor={`team-${team.id}`} className="text-sm">
                        {team.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isActive" name="isActive" defaultChecked />
                <Label htmlFor="isActive">Active Zone</Label>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" disabled={createZoneMutation.isPending}>
                  {createZoneMutation.isPending ? "Creating..." : "Create Zone"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Zone Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredZones.map((zone) => (
          <Card key={zone.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <CardTitle className="text-lg">{zone.name}</CardTitle>
                </div>
                {user?.role === "admin" && (
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingZone(zone)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteZoneMutation.mutate(zone.id)}
                      disabled={deleteZoneMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <CardDescription>{zone.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {zone.building ? `${zone.building} - ${zone.floor}` : zone.floor}
                    </span>
                  </div>
                  <Badge className={getTypeColor(zone.type)}>
                    {zone.type}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div className="flex flex-wrap gap-1">
                    {zone.assignedTeams.length > 0 ? (
                      zone.assignedTeams.map((team) => (
                        <Badge key={team} variant="outline" className="text-xs">
                          {team}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No teams assigned</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{zone.totalAudits} audits</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    Last: {zone.lastAudit ? new Date(zone.lastAudit).toLocaleDateString() : "Never"}
                  </span>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Compliance Score</span>
                    <span className={`text-lg font-bold ${getComplianceColor(zone.complianceScore)}`}>
                      {zone.complianceScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className={`h-2 rounded-full ${
                        zone.complianceScore >= 90 ? 'bg-green-500' :
                        zone.complianceScore >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${zone.complianceScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Zone Modal */}
      {editingZone && user?.role === "admin" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Edit Zone: {editingZone.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateZone} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Zone Name</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={editingZone.name}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-type">Type</Label>
                    <Select name="type" defaultValue={editingZone.type}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="factory">Factory</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="storage">Storage</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    defaultValue={editingZone.description}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-building">Building</Label>
                    <Input
                      id="edit-building"
                      name="building"
                      defaultValue={editingZone.building}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-floor">Floor</Label>
                    <Input
                      id="edit-floor"
                      name="floor"
                      defaultValue={editingZone.floor}
                    />
                  </div>
                </div>
                <div>
                  <Label>Assigned Teams</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {teams.map((team) => (
                      <div key={team.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`edit-team-${team.id}`}
                          name="assignedTeams"
                          value={team.name}
                          defaultChecked={editingZone.assignedTeams.includes(team.name)}
                        />
                        <Label htmlFor={`edit-team-${team.id}`} className="text-sm">
                          {team.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isActive"
                    name="isActive"
                    defaultChecked={editingZone.isActive}
                  />
                  <Label htmlFor="edit-isActive">Active Zone</Label>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={updateZoneMutation.isPending}>
                    {updateZoneMutation.isPending ? "Updating..." : "Update Zone"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingZone(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}