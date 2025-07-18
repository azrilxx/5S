import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Clock, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ZONES, TEAMS } from "@/lib/constants";
import { useAuth } from "@/components/auth/auth-provider";
import Layout from "@/components/layout/layout";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from "date-fns";

export default function Schedules() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showNewScheduleDialog, setShowNewScheduleDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [newScheduleData, setNewScheduleData] = useState({
    title: "",
    zone: "",
    assignedTo: "",
    frequency: "weekly",
    dayOfWeek: 1,
    time: "09:00",
    duration: 60,
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["/api/schedules"],
  });

  const createScheduleMutation = useMutation({
    mutationFn: (scheduleData: any) => apiRequest("POST", "/api/schedules", scheduleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setShowNewScheduleDialog(false);
      setNewScheduleData({
        title: "",
        zone: "",
        assignedTo: "",
        frequency: "weekly",
        dayOfWeek: 1,
        time: "09:00",
        duration: 60,
      });
      toast({
        title: "Success",
        description: "Schedule created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create schedule",
        variant: "destructive",
      });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      apiRequest("PUT", `/api/schedules/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setSelectedSchedule(null);
      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive",
      });
    },
  });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getSchedulesForDay = (day: Date) => {
    return (schedules as any[])?.filter((schedule: any) => {
      if (schedule.frequency === "weekly") {
        return schedule.dayOfWeek === day.getDay();
      }
      return false;
    }) || [];
  };

  const handleCreateSchedule = () => {
    if (!newScheduleData.title || !newScheduleData.zone || !newScheduleData.assignedTo) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + ((newScheduleData.dayOfWeek + 7 - nextRun.getDay()) % 7));
    const [hours, minutes] = newScheduleData.time.split(':');
    nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    createScheduleMutation.mutate({
      ...newScheduleData,
      nextRun: nextRun.toISOString(),
    });
  };

  const handleUpdateSchedule = (updates: any) => {
    if (!selectedSchedule) return;
    
    updateScheduleMutation.mutate({
      id: selectedSchedule.id,
      updates,
    });
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  const getZoneColor = (zone: string) => {
    const colors = {
      'Factory Zone 1': 'bg-blue-100 text-blue-800',
      'Factory Zone 2': 'bg-purple-100 text-purple-800',
      'Office Ground Floor': 'bg-green-100 text-green-800',
      'First Floor': 'bg-yellow-100 text-yellow-800',
      'Second Floor': 'bg-red-100 text-red-800',
    };
    return colors[zone as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout
      title="Audit Schedules"
      subtitle="Manage recurring audit schedules"
      showNewAuditButton={false}
    >
      <div className="space-y-6">
        {/* Header Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Weekly Schedule</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={() => setShowNewScheduleDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Schedule
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="min-h-[200px]">
                  <div className="text-center text-sm font-medium text-slate-700 py-2 border-b">
                    {format(day, 'EEE')}
                    <div className="text-xs text-slate-500">{format(day, 'd')}</div>
                  </div>
                  <div className="space-y-2 p-2">
                    {getSchedulesForDay(day).map((schedule: any) => (
                      <div
                        key={schedule.id}
                        className={`p-2 rounded-md text-xs cursor-pointer hover:opacity-80 ${getZoneColor(schedule.zone)}`}
                        onClick={() => setSelectedSchedule(schedule)}
                      >
                        <div className="font-medium">{schedule.zone}</div>
                        <div className="flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {schedule.time}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {schedule.assignedTo}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Schedules List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-slate-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (schedules as any[])?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No schedules found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(schedules as any[])?.map((schedule: any) => (
                  <div key={schedule.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{schedule.title}</h3>
                      <p className="text-sm text-slate-600">{schedule.zone}</p>
                      <p className="text-xs text-slate-500">
                        {schedule.frequency} • {getDayName(schedule.dayOfWeek)} at {schedule.time} • 
                        Assigned to: {schedule.assignedTo}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={schedule.isActive ? "default" : "secondary"}>
                        {schedule.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSchedule(schedule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Schedule Dialog */}
        <Dialog open={showNewScheduleDialog} onOpenChange={setShowNewScheduleDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Schedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Schedule Title</Label>
                <Input
                  id="title"
                  value={newScheduleData.title}
                  onChange={(e) => setNewScheduleData({ ...newScheduleData, title: e.target.value })}
                  placeholder="Enter schedule title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zone">Zone</Label>
                  <Select
                    value={newScheduleData.zone}
                    onValueChange={(value) => setNewScheduleData({ ...newScheduleData, zone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {ZONES.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Select
                    value={newScheduleData.assignedTo}
                    onValueChange={(value) => setNewScheduleData({ ...newScheduleData, assignedTo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAMS.map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={newScheduleData.frequency}
                    onValueChange={(value) => setNewScheduleData({ ...newScheduleData, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dayOfWeek">Day of Week</Label>
                  <Select
                    value={newScheduleData.dayOfWeek.toString()}
                    onValueChange={(value) => setNewScheduleData({ ...newScheduleData, dayOfWeek: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                      <SelectItem value="0">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newScheduleData.time}
                    onChange={(e) => setNewScheduleData({ ...newScheduleData, time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newScheduleData.duration}
                  onChange={(e) => setNewScheduleData({ ...newScheduleData, duration: parseInt(e.target.value) })}
                  placeholder="60"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewScheduleDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSchedule} disabled={createScheduleMutation.isPending}>
                  {createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Schedule Dialog */}
        {selectedSchedule && (
          <Dialog open={!!selectedSchedule} onOpenChange={() => setSelectedSchedule(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <p className="text-sm text-slate-900">{selectedSchedule.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Zone</Label>
                    <p className="text-sm text-slate-900">{selectedSchedule.zone}</p>
                  </div>
                  <div>
                    <Label>Assigned To</Label>
                    <p className="text-sm text-slate-900">{selectedSchedule.assignedTo}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Frequency</Label>
                    <p className="text-sm text-slate-900">{selectedSchedule.frequency}</p>
                  </div>
                  <div>
                    <Label>Day</Label>
                    <p className="text-sm text-slate-900">{getDayName(selectedSchedule.dayOfWeek)}</p>
                  </div>
                  <div>
                    <Label>Time</Label>
                    <p className="text-sm text-slate-900">{selectedSchedule.time}</p>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Select
                      value={selectedSchedule.isActive ? "active" : "inactive"}
                      onValueChange={(value) => handleUpdateSchedule({ isActive: value === "active" })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setSelectedSchedule(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}
