import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { 
  Search, 
  Filter, 
  CalendarIcon, 
  MapPin, 
  User, 
  FileText,
  TrendingUp,
  TrendingDown,
  Eye,
  Download
} from "lucide-react";
import Layout from "@/components/layout/layout";

interface Audit {
  id: number;
  title: string;
  zone: string;
  auditor: string;
  status: string;
  scheduledDate: string;
  completedAt?: string;
  overallScore?: number;
  notes?: string;
  createdAt: string;
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

export default function AuditHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [activeTab, setActiveTab] = useState('all');

  const { data: audits, isLoading } = useQuery<Audit[]>({
    queryKey: ["/api/audits"],
  });

  const { data: zones } = useQuery<any[]>({
    queryKey: ["/api/zones"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: currentUser } = useQuery<AuthResponse>({
    queryKey: ["/api/users/me"],
  });

  // Filter audits based on user role and filters
  const filteredAudits = audits?.filter((audit: Audit) => {
    // Role-based filtering
    if (currentUser?.data?.role !== 'admin' && audit.auditor !== currentUser?.data?.username) {
      return false;
    }

    // Search filter
    if (searchTerm && !audit.zone.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !audit.auditor.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Zone filter
    if (selectedZone && audit.zone !== selectedZone) {
      return false;
    }

    // User filter
    if (selectedUser && audit.auditor !== selectedUser) {
      return false;
    }

    // Date filter
    if (selectedDate) {
      const auditDate = new Date(audit.scheduledDate);
      const filterDate = new Date(selectedDate);
      if (auditDate.toDateString() !== filterDate.toDateString()) {
        return false;
      }
    }

    return true;
  }) || [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateStats = () => {
    const completedAudits = filteredAudits.filter((a: any) => a.status === 'completed');
    const totalScore = completedAudits.reduce((sum: number, audit: any) => sum + (audit.overallScore || 0), 0);
    const avgScore = completedAudits.length > 0 ? Math.round(totalScore / completedAudits.length) : 0;
    
    return {
      total: filteredAudits.length,
      completed: completedAudits.length,
      avgScore,
      highScoring: completedAudits.filter((a: any) => a.overallScore >= 80).length
    };
  };

  const stats = calculateStats();

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedZone('');
    setSelectedUser('');
    setSelectedDate(undefined);
  };

  return (
    <Layout 
      title="Audit History" 
      subtitle="View and analyze completed audits"
      showHomeButton={true}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Audits</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Average Score</p>
                  <p className="text-2xl font-bold">{stats.avgScore}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">High Scoring</p>
                  <p className="text-2xl font-bold">{stats.highScoring}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search audits..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Zone</label>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger>
                    <SelectValue placeholder="All zones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All zones</SelectItem>
                    {zones?.map((zone: any) => (
                      <SelectItem key={zone.id} value={zone.name}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentUser?.data?.role === 'admin' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">User</label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All users</SelectItem>
                      {users?.map((user: User) => (
                        <SelectItem key={user.id} value={user.username}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Any date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit List */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Records</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredAudits.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No audits found matching your criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAudits?.map((audit: Audit) => (
                  <div key={audit.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium">{audit.title}</h3>
                          <Badge className={getStatusColor(audit.status)}>
                            {audit.status}
                          </Badge>
                          {audit.overallScore !== null && audit.overallScore !== undefined && (
                            <Badge className={getScoreColor(audit.overallScore)}>
                              {audit.overallScore}%
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-slate-600">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {audit.zone}
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {audit.auditor}
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {format(new Date(audit.scheduledDate), "MMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}