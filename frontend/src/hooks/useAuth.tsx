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
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
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

  useEffect(() => {
    // Check for existing token on app start
    const existingToken = localStorage.getItem("token");
    if (existingToken) {
      setToken(existingToken);
      // Decode token to get user info
      const decoded = decodeToken(existingToken);
      if (decoded && decoded.user) {
        setUser(decoded.user);
      } else if (decoded && decoded.id && decoded.email && decoded.role) {
        // Fallback: create user object from token payload
        const userFromToken = {
          id: decoded.id,
          email: decoded.email,
          firstName: decoded.firstName || "",
          lastName: decoded.lastName || "",
          role: decoded.role,
          isVerified: decoded.isVerified || false
        };
        setUser(userFromToken);
      } else {
        // Final fallback: set basic user info
        setUser({ id: "", email: "", firstName: "", lastName: "", role: "USER" });
      }
    } else {
      // Final fallback: set basic user info
      setUser({ id: "", email: "", firstName: "", lastName: "", role: "USER" });
    }
  }, []);

  const login = (newToken: string, userData?: User) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    
    if (userData) {
      setUser(userData);
    } else {
      // Decode token to get user info
      const decoded = decodeToken(newToken);
      if (decoded && decoded.user) {
        setUser(decoded.user);
      } else if (decoded && decoded.id && decoded.email && decoded.role) {
        // Fallback: create user object from token payload
        const userFromToken = {
          id: decoded.id,
          email: decoded.email,
          firstName: decoded.firstName || "",
          lastName: decoded.lastName || "",
          role: decoded.role,
          isVerified: decoded.isVerified || false
        };
        setUser(userFromToken);
      } else {
        // Final fallback: set basic user info
        setUser({ id: "", email: "", firstName: "", lastName: "", role: "USER" });
      }
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
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
    if (token) {
      try {
        const response = await authApi.getCurrentUser();
        if (response.success && response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
        // If refresh fails, try to decode token again
        const decoded = decodeToken(token);
        if (decoded && decoded.user) {
          setUser(decoded.user);
        }
      }
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