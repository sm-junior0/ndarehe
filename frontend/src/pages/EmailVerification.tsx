import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { authApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { updateUserVerification, updateUser, refreshUser } = useAuth();

  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError("No verification token provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Verifying email with token:', token);
        const response = await authApi.verifyEmail(token);
        console.log('Email verification response:', response);
        
        if (response.success) {
          setSuccess(true);
          // Update the user's verification status in the auth context
          updateUserVerification(true);
          // If the response includes user data, update it directly
          if (response.data && response.data.user) {
            updateUser(response.data.user);
          } else {
            // Fallback: refresh user data from the server
            await refreshUser();
          }
          toast({
            title: "Email Verified!",
            description: "Your email has been verified successfully. You can now book services.",
          });
        } else {
          setError(response.message || "Email verification failed");
          toast({
            title: "Verification Failed",
            description: response.message || "Failed to verify your email. Please try again.",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        console.error("Email verification error:", err);
        setError(err.message || "Failed to verify email");
        toast({
          title: "Verification Failed",
          description: err.message || "Failed to verify your email. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                </div>
                <CardTitle>Verifying Your Email</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Please wait while we verify your email address...
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              {success ? (
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              ) : (
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              )}
              <CardTitle>
                {success ? "Email Verified!" : "Verification Failed"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {success ? (
                <>
                  <p className="text-muted-foreground">
                    Your email has been verified successfully. You can now access all features of NDAREHE.
                  </p>
                  <div className="space-y-2">
                    <Button asChild className="w-full">
                      <Link to="/">Start Exploring</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/explore">Browse Services</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    {error || "We couldn't verify your email address. The link may be expired or invalid."}
                  </p>
                  <div className="space-y-2">
                    <Button asChild className="w-full">
                      <Link to="/login">Go to Login</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/">Back to Home</Link>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EmailVerification; 