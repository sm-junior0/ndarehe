import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail } from "lucide-react";
import { authApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await authApi.login(email, password);
      
      if (response.success) {
        // Store token and update auth context with user data
        localStorage.setItem("token", response.data.token);
        login(response.data.token, response.data.user);
        
        toast({
          title: "Login Successful!",
          description: `Welcome back, ${response.data.user.firstName}!`,
        });
        
        // Redirect based on user role
        const userRole = response.data.user.role;
        switch (userRole) {
          case 'ADMIN':
            navigate('/admin');
            break;
          case 'PROVIDER':
            navigate('/provider-dashboard');
            break;
          case 'USER':
          default:
            navigate('/dashboard');
            break;
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage = err.message || "Login failed. Please check your credentials.";
      setError(errorMessage);
      
      // Check if error is related to email verification
      if (errorMessage.toLowerCase().includes("verify") || errorMessage.toLowerCase().includes("email")) {
        setShowResend(true);
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setResendLoading(true);
      const response = await authApi.resendVerification(email);
      
      if (response.success) {
        toast({
          title: "Verification Email Sent!",
          description: "Please check your email for the verification link.",
        });
        setShowResend(false);
      }
    } catch (err: any) {
      console.error("Resend verification error:", err);
      toast({
        title: "Failed to Send",
        description: err.message || "Failed to send verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="hover:bg-green-50 hover:text-green-700 transition-all duration-300">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center">Login</CardTitle>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              {loading ? "Logging in..." : "Login"}
            </Button>
            
            {showResend && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">
                  It looks like you need to verify your email address first.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {resendLoading ? "Sending..." : "Resend Verification Email"}
                </Button>
              </div>
            )}
            <div className="text-sm text-center mt-2">
              Don't have an account? <a href="/register" className="text-green-600 hover:text-green-700 hover:underline">Register</a>
            </div>
          </form>
        </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;