import { Bell, Plus, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

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
          <Button variant="outline" size="sm" className="hover:bg-slate-50 border-slate-300">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            <Badge variant="destructive" className="ml-2 shadow-sm">
              3
            </Badge>
          </Button>
          {showNewAuditButton && (
            <Button onClick={onNewAudit} size="sm" className="bg-primary hover:bg-primary/90 shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              New Audit
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
