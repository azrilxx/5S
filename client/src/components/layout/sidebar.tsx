import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Calendar, 
  CheckSquare, 
  BarChart3, 
  Settings,
  LogOut,
  MapPin,
  Users,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Shield,
  TrendingUp,
  FileText,
  Target
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

const navigationSections = [
  {
    title: "Core Functions",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Audits", href: "/audits", icon: ClipboardList },
      { name: "Corrective Actions", href: "/actions", icon: CheckSquare },
      { name: "Schedules", href: "/schedules", icon: Calendar },
    ]
  },
  {
    title: "Management",
    items: [
      { name: "Zones", href: "/zones", icon: MapPin },
      { name: "Teams", href: "/teams", icon: Users },
      { name: "Reports", href: "/reports", icon: BarChart3 },
      { name: "Analytics", href: "/analytics", icon: TrendingUp },
      { name: "KPI Tracking", href: "/kpi", icon: Target },
    ]
  },
  {
    title: "Learning & Development",
    items: [
      { name: "Learn 5S", href: "/learn", icon: BookOpen },
      { name: "Trainings", href: "/trainings", icon: GraduationCap },
      { name: "Documentation", href: "/documentation", icon: FileText },
    ]
  },
  {
    title: "System",
    items: [
      { name: "Feedback", href: "/feedback", icon: MessageSquare },
      { name: "Settings", href: "/settings", icon: Settings },
      { name: "Access Control", href: "/access-control", icon: Shield },
    ]
  }
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-slate-200">
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="flex items-center px-6 py-4 border-b border-slate-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <ClipboardList className="text-white h-5 w-5" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-slate-900">Karisma 5S</h1>
              <p className="text-xs text-slate-500">Audit System</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-6 py-4 space-y-6 overflow-y-auto">
          {navigationSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center px-0 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-primary text-white"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="px-6 py-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-900">{user.username || 'Unknown'}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
