import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { authApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();
  const { updateUserVerification } = useAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      console.log('Verification token:', token); // Debug log
      
      if (!token) {
        setVerificationStatus('error');
        setErrorMessage('No verification token found in the URL');
        return;
      }

      try {
        console.log('Making API call to verify email...'); // Debug log
        const response = await authApi.verifyEmail(token);
        console.log('API response:', response); // Debug log
        
        if (response.success) {
          setVerificationStatus('success');
          updateUserVerification(true);
          toast({
            title: "Email Verified!",
            description: "Your email has been verified successfully. You can now access all features.",
          });
        } else {
          setVerificationStatus('error');
          setErrorMessage(response.message || 'Verification failed');
        }
      } catch (error: any) {
        console.error('Verification error:', error); // Debug log
        setVerificationStatus('error');
        setErrorMessage(error.message || 'Verification failed. Please try again.');
        toast({
          title: "Verification Failed",
          description: error.message || "Failed to verify email. Please try again.",
          variant: "destructive",
        });
      }
    };

    verifyEmail();
  }, [searchParams, toast, updateUserVerification]);

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
            <div className="space-y-2">
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