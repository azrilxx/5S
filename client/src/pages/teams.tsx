import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Users, MapPin, UserPlus, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

interface Team {
  id: number;
  name: string;
  leader: string;
  members: string[];
  assignedZones: string[];
  responsibilities: string[];
}

interface User {
  id: number;
  username: string;
  name: string;
  team: string | null;
}

interface Zone {
  id: number;
  name: string;
  type: string;
  floor: string;
}

export default function Teams() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: zones = [], isLoading: zonesLoading } = useQuery<Zone[]>({
    queryKey: ["/api/zones"],
  });

  const createTeamMutation = useMutation({
    mutationFn: async (teamData: Omit<Team, "id">) => {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(teamData),
      });
      if (!response.ok) throw new Error("Failed to create team");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Team created successfully" });
      setShowCreateForm(false);
    },
    onError: () => {
      toast({ title: "Failed to create team", variant: "destructive" });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async (teamData: Team) => {
      const response = await fetch(`/api/teams/${teamData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(teamData),
      });
      if (!response.ok) throw new Error("Failed to update team");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Team updated successfully" });
      setEditingTeam(null);
    },
    onError: () => {
      toast({ title: "Failed to update team", variant: "destructive" });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete team");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Team deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete team", variant: "destructive" });
    },
  });

  const handleCreateTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const teamData = {
      name: formData.get("name") as string,
      leader: formData.get("leader") as string,
      members: (formData.get("members") as string).split(",").map(m => m.trim()).filter(Boolean),
      assignedZones: (formData.get("assignedZones") as string).split(",").map(z => z.trim()).filter(Boolean),
      responsibilities: (formData.get("responsibilities") as string).split(",").map(r => r.trim()).filter(Boolean),
    };
    createTeamMutation.mutate(teamData);
  };

  const handleUpdateTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTeam) return;
    const formData = new FormData(e.currentTarget);
    const teamData = {
      ...editingTeam,
      name: formData.get("name") as string,
      leader: formData.get("leader") as string,
      members: (formData.get("members") as string).split(",").map(m => m.trim()).filter(Boolean),
      assignedZones: (formData.get("assignedZones") as string).split(",").map(z => z.trim()).filter(Boolean),
      responsibilities: (formData.get("responsibilities") as string).split(",").map(r => r.trim()).filter(Boolean),
    };
    updateTeamMutation.mutate(teamData);
  };

  // Get current user's team for regular users
  const currentUserTeam = user?.role !== 'admin' ? teams.find(team => team.members.includes(user?.name || '')) : null;

  if (teamsLoading || usersLoading || zonesLoading) {
    return <div className="p-6">Loading teams...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Teams Management</h1>
        <p className="text-gray-600">
          Manage work teams and their zone assignments for efficient 5S audit operations
        </p>
      </div>

      {/* Admin: Full team management */}
      {user?.role === 'admin' && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium">All Teams ({teams.length})</span>
            </div>
            <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </div>

          {/* Create Team Form */}
          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Team</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Team Name</Label>
                      <Input id="name" name="name" required placeholder="e.g., Galvanize, Chrome, Steel" />
                    </div>
                    <div>
                      <Label htmlFor="leader">Team Leader</Label>
                      <Input id="leader" name="leader" required placeholder="Leader username" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="members">Team Members (comma-separated)</Label>
                    <Input id="members" name="members" placeholder="username1, username2, username3" />
                  </div>
                  <div>
                    <Label htmlFor="assignedZones">Assigned Zones (comma-separated)</Label>
                    <Input id="assignedZones" name="assignedZones" placeholder="Factory Zone 1, Office Ground Floor" />
                  </div>
                  <div>
                    <Label htmlFor="responsibilities">Responsibilities (comma-separated)</Label>
                    <Input id="responsibilities" name="responsibilities" placeholder="Daily cleanup, Equipment maintenance" />
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={createTeamMutation.isPending}>
                      {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Teams Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card key={team.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTeam(team)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTeamMutation.mutate(team.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Leader: <span className="font-medium">{team.leader}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Members</h4>
                    <div className="flex flex-wrap gap-1">
                      {team.members.map((member, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {member}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Assigned Zones</h4>
                    <div className="flex flex-wrap gap-1">
                      {team.assignedZones.map((zone, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {zone}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {team.responsibilities.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-1">Responsibilities</h4>
                      <div className="text-sm text-gray-600">
                        {team.responsibilities.join(", ")}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* User: View own team only */}
      {user?.role !== 'admin' && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-medium">My Team</span>
          </div>

          {currentUserTeam ? (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-xl">{currentUserTeam.name}</CardTitle>
                <CardDescription>
                  Team Leader: <span className="font-medium">{currentUserTeam.leader}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Team Members</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentUserTeam.members.map((member, index) => (
                      <Badge key={index} variant="secondary">
                        {member}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Our Assigned Zones</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentUserTeam.assignedZones.map((zone, index) => (
                      <Badge key={index} variant="outline">
                        <MapPin className="w-3 h-3 mr-1" />
                        {zone}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {currentUserTeam.responsibilities.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Team Responsibilities</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {currentUserTeam.responsibilities.map((responsibility, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            {responsibility}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Assigned</h3>
                <p className="text-gray-600">
                  You haven't been assigned to a team yet. Please contact your administrator.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit Team Modal */}
      {editingTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Team: {editingTeam.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateTeam} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Team Name</Label>
                  <Input id="edit-name" name="name" defaultValue={editingTeam.name} required />
                </div>
                <div>
                  <Label htmlFor="edit-leader">Team Leader</Label>
                  <Input id="edit-leader" name="leader" defaultValue={editingTeam.leader} required />
                </div>
                <div>
                  <Label htmlFor="edit-members">Team Members (comma-separated)</Label>
                  <Input id="edit-members" name="members" defaultValue={editingTeam.members.join(", ")} />
                </div>
                <div>
                  <Label htmlFor="edit-zones">Assigned Zones (comma-separated)</Label>
                  <Input id="edit-zones" name="assignedZones" defaultValue={editingTeam.assignedZones.join(", ")} />
                </div>
                <div>
                  <Label htmlFor="edit-responsibilities">Responsibilities (comma-separated)</Label>
                  <Input id="edit-responsibilities" name="responsibilities" defaultValue={editingTeam.responsibilities.join(", ")} />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={updateTeamMutation.isPending}>
                    {updateTeamMutation.isPending ? "Updating..." : "Update Team"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingTeam(null)}>
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