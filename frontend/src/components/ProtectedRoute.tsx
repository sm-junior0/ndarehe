import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import LoginModal from "./LoginModal";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    if (!user && !hasCheckedAuth) {
      setShowLoginModal(true);
      setHasCheckedAuth(true);
    }
  }, [user, hasCheckedAuth]);

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
    // Redirect back to explore page when modal is closed
    navigate("/explore");
  };

  if (!user) {
    return (
      <>
        {fallback || (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Login Required</h2>
              <p className="text-muted-foreground">
                Please log in to access this page.
              </p>
            </div>
          </div>
        )}
        
        <LoginModal
          isOpen={showLoginModal}
          onClose={handleCloseModal}
          onSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute; 