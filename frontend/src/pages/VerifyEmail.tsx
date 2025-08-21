import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, ArrowLeft, Mail } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { authApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState("");
  const [resending, setResending] = useState(false);
  const { toast } = useToast();
  const { updateUserVerification, refreshUser, user } = useAuth(); 
  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Check if we have a status parameter (from redirect)
      const status = searchParams.get('status');
      const message = searchParams.get('message');
      
      if (status === 'success') {
        setVerificationStatus('success');
        updateUserVerification(true);
        refreshUser();
        toast({
          title: "Email Verified!",
          description: "Your email has been verified successfully.",
        });
        return;
      } else if (status === 'error') {
        setVerificationStatus('error');
        setErrorMessage(message || 'Verification failed');
        return;
      }

      // If no status parameter, proceed with token verification
      const token = searchParams.get('token');
      
      if (!token) {
        setVerificationStatus('error');
        setErrorMessage('No verification token found in the URL');
        return;
      }

      // Prevent multiple verification attempts
      if (hasVerified.current) {
        return;
      }

      // Mark as attempting verification to prevent duplicates
      hasVerified.current = true;

      try {
        const response = await authApi.verifyEmail(token);
        
        if (response.success) {
          setVerificationStatus('success');
          updateUserVerification(true);
          await refreshUser(); 
          toast({
            title: "Email Verified!",
            description: response.message || "Your email has been verified successfully.",
          });
        } else {
          setVerificationStatus('error');
          setErrorMessage(response.message || 'Verification failed');
          toast({
            title: "Verification Failed",
            description: response.message || "Failed to verify your email. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        setVerificationStatus('error');
        
        // Handle rate limit errors specifically
        if (error.status === 429) {
          const message = error.message || 'Too many verification attempts. Please wait a moment before trying again.';
          setErrorMessage(message);
          toast({
            title: "Please Wait",
            description: message,
            variant: "destructive",
          });
        } else {
          const message = error.message || 'Verification failed. Please try again.';
          setErrorMessage(message);
          toast({
            title: "Verification Failed",
            description: message,
            variant: "destructive",
          });
        }
      }
    };

    verifyEmail();
  }, [searchParams, toast, updateUserVerification, refreshUser]);

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const response = await authApi.resendVerification();
      
      if (response.success) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your email for the verification link.",
        });
      } else {
        toast({
          title: "Failed to Resend",
          description: response.message || "Failed to resend verification email. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to Resend",
        description: error.message || "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold">Verifying Your Email</h2>
            <p className="text-muted-foreground">Please wait while we verify your email address...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold text-green-600">Email Verified Successfully!</h2>
            <p className="text-muted-foreground">
              Your email has been verified. You can now access all features of NDAREHE Explorer Hub.
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link to="/">Start Exploring</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/login">Go to Login</Link>
              </Button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 text-red-600 mx-auto" />
            <h2 className="text-2xl font-bold text-red-600">Verification Failed</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            
            {!user?.isVerified && (
              <div className="pt-4">
                <Button 
                  onClick={handleResendVerification} 
                  disabled={resending}
                  className="w-full"
                >
                  {resending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              </div>
            )}
            
            <div className="space-y-2 pt-4">
              <Button asChild className="w-full">
                <Link to="/login">Go to Login</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="hover:bg-green-50 hover:text-green-700 transition-all duration-300">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle>Email Verification</CardTitle>
            </CardHeader>
            <CardContent>
              {renderContent()}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VerifyEmail;