import { useAuth } from "@/components/auth/auth-provider";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Sidebar />
      <div className={`min-h-screen transition-all duration-300 ease-in-out ${isMobile ? 'ml-0' : 'ml-64'}`}>
        <Header
          title={title}
          subtitle={subtitle}
          showNewAuditButton={showNewAuditButton}
          showHomeButton={showHomeButton}
          onNewAudit={onNewAudit}
        />
        <main className="p-4 sm:p-6 lg:p-8 xl:p-10">
          <div className="mx-auto max-w-7xl space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
