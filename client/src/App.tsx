import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";
import { tokenStorage } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Audits from "@/pages/audits";
import Actions from "@/pages/actions";
import Schedules from "@/pages/schedules";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Zones from "@/pages/zones";
import Teams from "@/pages/teams";
import Learn from "@/pages/learn";
import Trainings from "@/pages/trainings";
import Feedback from "@/pages/feedback";
import Analytics from "@/pages/analytics";
import KPITracking from "@/pages/kpi";
import Documentation from "@/pages/documentation";
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
      <Route path="/documentation">
        <ProtectedRoute>
          <Documentation />
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
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
