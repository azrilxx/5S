import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi, tokenStorage, type User } from "@/lib/auth";

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

  const { data: userData, isLoading: isUserLoading, error } = useQuery({
    queryKey: ["/api/users/me"],
    enabled: !!tokenStorage.get(),
    retry: false,
  });

  useEffect(() => {
    if (userData) {
      setUser(userData as User);
      setIsLoading(false);
    } else if (error) {
      // If there's an error, clear the token and mark as not loading
      tokenStorage.remove();
      setUser(null);
      setIsLoading(false);
    } else if (!tokenStorage.get()) {
      // No token, not loading
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
