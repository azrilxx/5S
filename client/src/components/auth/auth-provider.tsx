import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi, tokenStorage } from "@/lib/auth";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  team: string | null;
  zones: string[];
  isActive?: boolean;
  createdAt?: Date;
}

interface AuthResponse {
  success: boolean;
  data: User;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token and get user data
  const { data: userData, isLoading: isUserLoading, error } = useQuery<AuthResponse>({
    queryKey: ['/api/users/me'],
    enabled: !!tokenStorage.get(),
    retry: false,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache user data
  });

  useEffect(() => {
    if (userData && userData.success) {
      console.log(`[DEBUG] AuthProvider - Setting user:`, userData.data);
      setUser(userData.data);
      setIsLoading(false);
    } else if (error || !tokenStorage.get()) {
      setUser(null);
      setIsLoading(false);
    } else {
      setIsLoading(isUserLoading);
    }
  }, [userData, isUserLoading, error]);

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password);
      if (response.success && response.data) {
        tokenStorage.set(response.data.accessToken);
        setUser(response.data.user);
        setIsLoading(false);
        return;
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    tokenStorage.remove();
    setUser(null);
    // Clear all localStorage to force fresh data
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
