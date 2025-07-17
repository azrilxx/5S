import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";
import { I18nProvider } from "@/lib/i18n";
import { tokenStorage } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Audits from "@/pages/audits";
import AuditNew from "@/pages/audit-new";
import AuditForm from "@/pages/audit-form";
import AuditHistory from "@/pages/audit-history";
import Actions from "@/pages/actions";
import Schedules from "@/pages/schedules";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import ProfileSettings from "@/pages/profile-settings";
import RoleManagement from "@/pages/role-management";
import Zones from "@/pages/zones";
import Teams from "@/pages/teams";
import UserManagement from "@/pages/user-management";
import SystemLogs from "@/pages/system-logs";
import QuestionEditor from "@/pages/question-editor";
import ActionTracker from "@/pages/action-tracker";
import NotificationRules from "@/pages/notification-rules";
import NotificationSettings from "@/pages/notification-settings";
import Learn from "@/pages/learn";
import Trainings from "@/pages/trainings";
import Feedback from "@/pages/feedback";
import Analytics from "@/pages/analytics";
import KPITracking from "@/pages/kpi";

import AccessControl from "@/pages/access-control";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";


// Setup token interceptor for API requests
const setupTokenInterceptor = () => {
  const originalFetch = window.fetch;
  window.fetch = async (input, init = {}) => {
    const token = tokenStorage.get();
    if (token && typeof input === 'string' && input.startsWith('/api')) {
      init.headers = {
        ...init.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return originalFetch(input, init);
  };
};

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  // If no token exists, show login immediately
  if (!tokenStorage.get()) {
    return <Login />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/audits">
        <ProtectedRoute>
          <Audits />
        </ProtectedRoute>
      </Route>
      <Route path="/audits/new">
        <ProtectedRoute>
          <AuditNew />
        </ProtectedRoute>
      </Route>
      <Route path="/audits/new/:zone">
        <ProtectedRoute>
          <AuditForm />
        </ProtectedRoute>
      </Route>
      <Route path="/audits/history">
        <ProtectedRoute>
          <AuditHistory />
        </ProtectedRoute>
      </Route>
      <Route path="/actions">
        <ProtectedRoute>
          <Actions />
        </ProtectedRoute>
      </Route>
      <Route path="/schedules">
        <ProtectedRoute>
          <Schedules />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <ProfileSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/role-management">
        <ProtectedRoute>
          <RoleManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/zones">
        <ProtectedRoute>
          <Zones />
        </ProtectedRoute>
      </Route>
      <Route path="/teams">
        <ProtectedRoute>
          <Teams />
        </ProtectedRoute>
      </Route>
      <Route path="/user-management">
        <ProtectedRoute>
          <UserManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/system-logs">
        <ProtectedRoute>
          <SystemLogs />
        </ProtectedRoute>
      </Route>
      <Route path="/question-editor">
        <ProtectedRoute>
          <QuestionEditor />
        </ProtectedRoute>
      </Route>
      <Route path="/action-tracker">
        <ProtectedRoute>
          <ActionTracker />
        </ProtectedRoute>
      </Route>
      <Route path="/notification-rules">
        <ProtectedRoute>
          <NotificationRules />
        </ProtectedRoute>
      </Route>
      <Route path="/notification-settings">
        <ProtectedRoute>
          <NotificationSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/learn">
        <ProtectedRoute>
          <Learn />
        </ProtectedRoute>
      </Route>
      <Route path="/trainings">
        <ProtectedRoute>
          <Trainings />
        </ProtectedRoute>
      </Route>
      <Route path="/feedback">
        <ProtectedRoute>
          <Feedback />
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      </Route>
      <Route path="/kpi">
        <ProtectedRoute>
          <KPITracking />
        </ProtectedRoute>
      </Route>

      <Route path="/access-control">
        <ProtectedRoute>
          <AccessControl />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    setupTokenInterceptor();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
