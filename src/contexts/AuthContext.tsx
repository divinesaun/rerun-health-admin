import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi, type PharmacyUser, type LoginResponse } from "@/lib/api";
import { adminAuthApi, type AdminLoginResponse } from "@/lib/adminApi";

interface AuthState {
  user: PharmacyUser | null;
  token: string | null;
  mustChangePassword: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<LoginResponse>;
  loginAdmin: (email: string, password: string) => Promise<AdminLoginResponse>;
  logout: () => void;
  setToken: (token: string) => void;
  clearMustChangePassword: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem("access_token"),
    mustChangePassword: false,
    isLoading: true,
    isAuthenticated: false,
    isAdmin: localStorage.getItem("user_role") === "admin",
  });

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setState((s) => ({ ...s, isLoading: false, isAuthenticated: false, user: null }));
      return;
    }
    const role = localStorage.getItem("user_role");
    try {
      if (role === "admin") {
        const { user } = await adminAuthApi.me();
        setState((s) => ({
          ...s,
          user: user as unknown as PharmacyUser,
          token,
          isLoading: false,
          isAuthenticated: true,
          isAdmin: true,
        }));
      } else {
        const { user } = await authApi.me();
        setState((s) => ({
          ...s,
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
          isAdmin: false,
        }));
      }
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_role");
      setState((s) => ({ ...s, isLoading: false, isAuthenticated: false, user: null, token: null, isAdmin: false }));
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    const data = await authApi.login(email, password);
    localStorage.setItem("access_token", data.access_token);
    setState({
      user: data.user,
      token: data.access_token,
      mustChangePassword: data.must_change_password,
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
    });
    localStorage.setItem("user_role", "pharmacy");
    return data;
  };

  const loginAdmin = async (email: string, password: string): Promise<AdminLoginResponse> => {
    const data = await adminAuthApi.login(email, password);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user_role", "admin");
    setState({
      user: data.user as unknown as PharmacyUser,
      token: data.access_token,
      mustChangePassword: false,
      isLoading: false,
      isAuthenticated: true,
      isAdmin: true,
    });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    setState({
      user: null,
      token: null,
      mustChangePassword: false,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
    });
  };

  const setToken = (token: string) => {
    localStorage.setItem("access_token", token);
    setState((s) => ({ ...s, token }));
  };

  const clearMustChangePassword = () => {
    setState((s) => ({ ...s, mustChangePassword: false }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, loginAdmin, logout, setToken, clearMustChangePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
