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
    <header className="bg-white shadow-sm border-b border-slate-200 pl-6 pr-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {showHomeButton && (
            <Link href="/">
              <Button variant="ghost" size="sm" className="px-2">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            <Badge variant="destructive" className="ml-2">
              3
            </Badge>
          </Button>
          {showNewAuditButton && (
            <Button onClick={onNewAudit} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Audit
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
