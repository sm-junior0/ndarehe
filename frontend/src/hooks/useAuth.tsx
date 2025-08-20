import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/api";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData?: User) => void;
  logout: () => void;
  updateUserVerification: (isVerified: boolean) => void;
  updateUser: (userData: User) => void;
  refreshUser: () => Promise<void>;
}

// Helper function to decode JWT token (basic implementation)
const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const clearAuthState = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const existingToken = localStorage.getItem("token");

      if (existingToken) {
        try {
          // Verify token is still valid with backend
          const response = await authApi.getCurrentUser();

          if (response.success && response.data.user) {
            setToken(existingToken);
            setUser(response.data.user);
          } else {
            // Token is invalid - clear it
            clearAuthState();
          }
        } catch (error) {
          // API call failed - assume token is invalid
          clearAuthState();
        }
      } else {
        // No token - ensure clean state
        clearAuthState();
      }
    };

    initializeAuth();
  }, []);

  const login = async (newToken: string, userData?: User) => {
    try {
      // Verify the token is valid before accepting it
      const decoded = decodeToken(newToken);
      if (!decoded || !decoded.id) {
        throw new Error("Invalid token");
      }

      // Store the valid token
      setToken(newToken);
      localStorage.setItem("token", newToken);

      // Set user data (either provided or from token)
      if (userData) {
        setUser(userData);
      } else {
        const userFromToken = {
          id: decoded.id,
          email: decoded.email,
          firstName: decoded.firstName || "",
          lastName: decoded.lastName || "",
          role: decoded.role || "USER",
          isVerified: decoded.isVerified || false
        };
        setUser(userFromToken);
      }
    } catch (error) {
      clearAuthState();
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear frontend state immediately
      clearAuthState();

      // Attempt API logout (will work even if token is invalid)
      await authApi.logout().catch(() => { });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Force reload to clear any cached data
      window.location.href = '/login';
    }
  };

  const updateUserVerification = (isVerified: boolean) => {
    if (user) {
      setUser({ ...user, isVerified });
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const refreshUser = async () => {
    if (!token) {
      clearAuthState();
      return;
    }

    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data.user) {
        setUser(response.data.user);
      } else {
        clearAuthState();
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      clearAuthState();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUserVerification, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};