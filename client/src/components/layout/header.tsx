import { Plus, Home, Calendar, Users, Settings, BarChart3, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
  subtitle: string;
  showNewAuditButton?: boolean;
  showHomeButton?: boolean;
  onNewAudit?: () => void;
}

export default function Header({ 
  title, 
  subtitle, 
  showNewAuditButton = true,
  showHomeButton = false,
  onNewAudit 
}: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200/80 px-6 py-5 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
          <p className="text-sm text-slate-600 font-medium mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-3">
          {showHomeButton && (
            <Link href="/">
              <Button variant="ghost" size="sm" className="px-3 hover:bg-slate-100">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
          )}

          {showNewAuditButton && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-sm">
                  <Menu className="h-4 w-4 mr-2" />
                  Quick Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={onNewAudit}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Audit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/schedules" className="flex items-center w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Audit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/teams" className="flex items-center w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Teams
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/analytics" className="flex items-center w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
