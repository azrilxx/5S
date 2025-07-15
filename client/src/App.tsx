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
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

// Setup token interceptor for API requests
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
