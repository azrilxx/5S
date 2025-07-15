import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
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
  Target,
  Menu,
  X,
  Edit,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth/auth-provider";
import { useState } from "react";
import MessagesButton from "@/components/messages/messages-button";

const getNavigationSections = (userRole: string) => {
  const coreFunctions = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Audits", href: "/audits", icon: ClipboardList },
  ];

  // Users can only see their own actions, admins can see all actions
  if (userRole === "admin") {
    coreFunctions.push(
      { name: "Corrective Actions", href: "/actions", icon: CheckSquare },
      { name: "Teams", href: "/teams", icon: Users },
      { name: "Schedules", href: "/schedules", icon: Calendar }
    );
  } else {
    coreFunctions.push(
      { name: "My Actions", href: "/actions", icon: CheckSquare },
      { name: "Teams", href: "/teams", icon: Users }
    );
  }

  const sections = [
    {
      title: "Core Functions",
      items: coreFunctions
    }
  ];

  // Admin-only sections
  if (userRole === "admin") {
    sections.push(
      {
        title: "Management",
        items: [
          { name: "Zones", href: "/zones", icon: MapPin },
          { name: "Question Editor", href: "/question-editor", icon: Edit },
          { name: "Action Tracker", href: "/action-tracker", icon: Target },
          { name: "Reports", href: "/reports", icon: BarChart3 },
          { name: "Analytics", href: "/analytics", icon: TrendingUp },
          { name: "KPI Tracking", href: "/kpi", icon: Target },
        ]
      },
      {
        title: "System Administration",
        items: [
          { name: "User Management", href: "/user-management", icon: Users },
          { name: "Notification Rules", href: "/notification-rules", icon: Bell },
          { name: "Settings", href: "/settings", icon: Settings },
          { name: "Access Control", href: "/access-control", icon: Shield },
          { name: "System Logs", href: "/system-logs", icon: FileText },
        ]
      }
    );
  }

  // Learning section for all users
  sections.push({
    title: "Learning & Development",
    items: [
      { name: "Learn 5S", href: "/learn", icon: BookOpen },
      { name: "Trainings", href: "/trainings", icon: GraduationCap },
      { name: "Documentation", href: "/documentation", icon: FileText },
      { name: "Feedback", href: "/feedback", icon: MessageSquare },
    ]
  });

  return sections;
};

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const navigationSections = getNavigationSections(user.role);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center">
          <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
            <ClipboardList className="text-white h-6 w-6" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Karisma 5S</h1>
            <p className="text-xs text-slate-600 font-medium">Audit System</p>
          </div>
        </div>
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation Menu */}
      <ScrollArea className="flex-1 px-6 py-6">
        <nav className="space-y-8">
          {navigationSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-1">
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
                      onClick={() => isMobile && setIsOpen(false)}
                      className={cn(
                        "flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out group",
                        isActive
                          ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/25"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm"
                      )}
                    >
                      <Icon className={cn(
                        "mr-3 h-4 w-4 transition-transform duration-200",
                        isActive ? "scale-110" : "group-hover:scale-105"
                      )} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* User Profile */}
      <div className="px-6 py-5 border-t border-slate-200/80 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-9 h-9 bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">
                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-slate-900">{user.username || 'Unknown'}</p>
              <p className="text-xs text-slate-600 font-medium capitalize">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MessagesButton />
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-slate-400 hover:text-red-500 transition-colors duration-200 p-1.5 rounded-lg hover:bg-red-50"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-md hover:shadow-lg"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/20 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl border-r border-slate-200 transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {sidebarContent}
        </div>
      </>
    );
  }

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl border-r border-slate-200/80 backdrop-blur-sm hidden lg:block">
      {sidebarContent}
    </div>
  );
}
