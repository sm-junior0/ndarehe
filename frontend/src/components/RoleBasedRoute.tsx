import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

const RoleBasedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectTo 
}: RoleBasedRouteProps) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If no token, redirect to login
    if (!token) {
      navigate("/login", { 
        state: { from: location.pathname },
        replace: true 
      });
      return;
    }

    // If token exists but no user data yet, wait for user to load
    if (!user) {
      return;
    }

    // If allowedRoles are specified, check if user has access
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // User doesn't have permission, redirect based on role
      redirectUserByRole(user.role);
      return;
    }

    // If redirectTo is specified and user doesn't have access, redirect
    if (redirectTo && user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      navigate(redirectTo, { replace: true });
      return;
    }
  }, [user, token, location.pathname, allowedRoles, redirectTo, navigate]);

  const redirectUserByRole = (role: string) => {
    switch (role) {
      case "ADMIN":
        navigate("/admin", { replace: true });
        break;
      case "USER":
        navigate("/dashboard", { replace: true });
        break;
      case "PROVIDER":
        navigate("/provider-dashboard", { replace: true });
        break;
      default:
        // Unknown role, redirect to user dashboard
        navigate("/dashboard", { replace: true });
        break;
    }
  };

  // Show loading while checking authentication
  if (!user && token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
