import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const RootRouteHandler = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If no token, stay on home page (no redirect)
    if (!token) {
      return;
    }

    // If token exists but no user data yet, wait for user to load
    if (!user) {
      return;
    }

    // If user is authenticated, redirect to appropriate dashboard based on role
    switch (user.role) {
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
  }, [user, token, navigate]);

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

  // Return null to render nothing while redirecting
  return null;
};

export default RootRouteHandler;
