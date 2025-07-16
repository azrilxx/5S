import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, MapPin, Users, Building, ArrowRight } from "lucide-react";
import Layout from "@/components/layout/layout";

interface Zone {
  id: number;
  name: string;
  description: string;
  type: string;
  buildingId: number;
  floorId: number;
  isActive: boolean;
}

interface Building {
  id: number;
  name: string;
  description: string;
  address: string;
  isActive: boolean;
}

interface Team {
  id: number;
  name: string;
  leader: string;
  members: string[];
  assignedZones: string[];
}

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  team: string | null;
  zones: string[];
}

interface AuthResponse {
  success: boolean;
  data: User;
}

export default function AuditNew() {
  const [, setLocation] = useLocation();
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const { data: allZones, isLoading: zonesLoading } = useQuery<Zone[]>({
    queryKey: ["/api/zones"],
  });

  const { data: currentUser } = useQuery<AuthResponse>({
    queryKey: ["/api/users/me"],
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Filter zones based on user's team assignments (admins see all zones)
  const zones = React.useMemo(() => {
    // Show all zones if data is still loading
    if (!allZones || !currentUser || !teams) return allZones;
    
    // Admins see all zones
    if (currentUser.data.role === 'admin') {
      return allZones;
    }
    
    // If user has no team, show all zones (fallback)
    if (!currentUser.data.team) {
      return allZones;
    }
    
    // Find user's team and filter zones
    const userTeam = teams.find((team: Team) => team.name === currentUser.data.team);
    if (!userTeam?.assignedZones) {
      return allZones;
    }
    
    return allZones.filter((zone: Zone) => 
      userTeam.assignedZones.includes(zone.name)
    );
  }, [allZones, currentUser, teams]);

  const { data: buildings } = useQuery<Building[]>({
    queryKey: ["/api/buildings"],
  });

  const selectedZoneDetails = zones?.find((z: Zone) => z.name === selectedZone);
  const selectedTeamDetails = selectedTeam && selectedTeam !== 'none' ? teams?.find((t: Team) => t.name === selectedTeam) : null;
  const buildingDetails = buildings?.find((b: Building) => b.id === selectedZoneDetails?.buildingId);

  const handleStartAudit = () => {
    if (!selectedZone) {
      return;
    }
    setLocation(`/audits/new/${encodeURIComponent(selectedZone)}`);
  };

  const canStartAudit = selectedZone && selectedDate;

  return (
    <Layout 
      title="New Audit" 
      subtitle="Create a new 5S workplace audit"
      showHomeButton={true}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Zone Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Select Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Zone *</Label>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a zone to audit" />
                  </SelectTrigger>
                  <SelectContent>
                    {zonesLoading ? (
                      <SelectItem value="loading" disabled>Loading zones...</SelectItem>
                    ) : (
                      zones?.map((zone: Zone) => (
                        <SelectItem key={zone.id} value={zone.name}>
                          {zone.name} ({zone.type})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedZoneDetails && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Zone Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-slate-600" />
                      <span className="text-slate-600">Building:</span>
                      <span className="ml-2 font-medium">{buildingDetails?.name}</span>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-slate-600 mt-0.5" />
                      <span className="text-slate-600">Description:</span>
                      <span className="ml-2">{selectedZoneDetails.description}</span>
                    </div>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        selectedZoneDetails.type === 'factory' ? 'bg-blue-500' : 'bg-green-500'
                      }`} />
                      <span className="text-slate-600">Type:</span>
                      <span className="ml-2 capitalize">{selectedZoneDetails.type}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Audit Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Selected: {format(selectedDate, "EEEE, MMMM do, yyyy")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Selection (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Team Assignment
            </CardTitle>
            <p className="text-sm text-slate-600">Optional: Assign a team to this audit</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Team (Optional)</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No team assignment</SelectItem>
                    {teams?.map((team: Team) => (
                      <SelectItem key={team.id} value={team.name}>
                        {team.name} (Leader: {team.leader})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTeamDetails && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Team Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-slate-600" />
                      <span className="text-slate-600">Leader:</span>
                      <span className="ml-2 font-medium">{selectedTeamDetails.leader}</span>
                    </div>
                    <div className="flex items-start">
                      <Users className="h-4 w-4 mr-2 text-slate-600 mt-0.5" />
                      <span className="text-slate-600">Members:</span>
                      <div className="ml-2 flex flex-wrap gap-1">
                        {selectedTeamDetails.members?.map((member: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {member}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary & Start Button */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Zone:</span>
                  <p className="font-medium">{selectedZone || "Not selected"}</p>
                </div>
                <div>
                  <span className="text-slate-600">Date:</span>
                  <p className="font-medium">{format(selectedDate, "MMM d, yyyy")}</p>
                </div>
                <div>
                  <span className="text-slate-600">Team:</span>
                  <p className="font-medium">{selectedTeam || "No team assigned"}</p>
                </div>
                <div>
                  <span className="text-slate-600">Categories:</span>
                  <p className="font-medium">5S (Sort, Set, Shine, Standardize, Sustain)</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={handleStartAudit}
                  disabled={!canStartAudit}
                  className="w-full"
                  size="lg"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Start Audit
                </Button>
                
                {!canStartAudit && (
                  <p className="text-sm text-slate-600 text-center mt-2">
                    Please select a zone and date to continue
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}