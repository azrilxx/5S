import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, User, Edit, Trash2, Plus } from "lucide-react";
import Layout from "@/components/layout/layout";

const users = [
  {
    id: 1,
    name: "Azril",
    email: "azril@karisma.com",
    role: "admin",
    team: "Galvanize",
    zones: ["All Zones"],
    lastLogin: "2025-01-10",
    status: "active"
  },
  {
    id: 2,
    name: "Shukri",
    email: "shukri@karisma.com",
    role: "admin",
    team: "Copper",
    zones: ["All Zones"],
    lastLogin: "2025-01-09",
    status: "active"
  },
  {
    id: 3,
    name: "Calvin",
    email: "calvin@karisma.com",
    role: "user",
    team: "Chrome",
    zones: ["Factory Zone 2", "Meeting Room (Ground Floor)", "Shoes Area"],
    lastLogin: "2025-01-08",
    status: "active"
  },
  {
    id: 4,
    name: "May",
    email: "may@karisma.com",
    role: "user",
    team: "Aluminum",
    zones: ["Surau Area (In)", "Surau Area (Out)", "Admin"],
    lastLogin: "2025-01-07",
    status: "active"
  }
];

export default function AccessControl() {
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "supervisor":
        return "bg-blue-100 text-blue-800";
      case "auditor":
        return "bg-green-100 text-green-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  return (
    <Layout 
      title="Access Control" 
      subtitle="Manage user permissions and roles"
      showHomeButton={true}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">User Management</h3>
            <p className="text-sm text-slate-600">Control user access and permissions</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Users & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Zones</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.team}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.zones.map((zone, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {zone}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-medium text-red-700">Admin</h4>
                  <p className="text-sm text-slate-600">Full system access, user management, all features</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-blue-700">Supervisor</h4>
                  <p className="text-sm text-slate-600">Zone management, audit oversight, team coordination</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-green-700">Auditor</h4>
                  <p className="text-sm text-slate-600">Conduct audits, create actions, assigned zones only</p>
                </div>
                <div className="border-l-4 border-gray-500 pl-4">
                  <h4 className="font-medium text-gray-700">Viewer</h4>
                  <p className="text-sm text-slate-600">Read-only access, view reports and dashboards</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Password Policy</h4>
                    <p className="text-sm text-slate-600">Minimum 8 characters, special characters required</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Session Timeout</h4>
                    <p className="text-sm text-slate-600">Auto-logout after 30 minutes of inactivity</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Audit Logging</h4>
                    <p className="text-sm text-slate-600">Track all user actions and changes</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}