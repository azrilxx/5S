import { useAuth } from "@/components/auth/auth-provider";
import Sidebar from "./sidebar";
import Header from "./header";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  showNewAuditButton?: boolean;
  showHomeButton?: boolean;
  onNewAudit?: () => void;
}

export default function Layout({ 
  children, 
  title, 
  subtitle, 
  showNewAuditButton, 
  showHomeButton,
  onNewAudit 
}: LayoutProps) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64 min-h-screen">
        <Header
          title={title}
          subtitle={subtitle}
          showNewAuditButton={showNewAuditButton}
          showHomeButton={showHomeButton}
          onNewAudit={onNewAudit}
        />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
