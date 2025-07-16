import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  team: string | null;
  zones: string[];
}

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/login", {
      username,
      password,
    });
    return response.json();
  },

  register: async (userData: any): Promise<User> => {
    const response = await apiRequest("POST", "/api/auth/register", userData);
    return response.json();
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiRequest("GET", "/api/users/me");
    return response.json();
  },
};

export const tokenStorage = {
  set: (token: string) => {
    localStorage.setItem("auth_token", token);
  },
  get: () => {
    return localStorage.getItem("auth_token");
  },
  remove: () => {
    localStorage.removeItem("auth_token");
  },
};
