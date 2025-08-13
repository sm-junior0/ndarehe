import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface EmailVerificationReminderProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: () => void;
}

const EmailVerificationReminder = ({ isOpen, onClose, onVerified }: EmailVerificationReminderProps) => {
  const { user, updateUserVerification } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setIsResending(true);
    try {
      const response = await authApi.resendVerification(user.email);
      
      if (response.success) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your email for the verification link.",
        });
      } else {
        throw new Error(response.message || "Failed to resend verification email");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleManualVerification = () => {
    // Close the modal and let user check their email
    onClose();
    toast({
      title: "Check Your Email",
      description: "Please check your email for the verification link and click it to verify your account.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <DialogTitle>Email Verification Required</DialogTitle>
              <DialogDescription>
                Please verify your email address to access this feature.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="p-2 bg-green-100 rounded-full">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-lg text-green-800">Verification Email Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 mb-3">
                We've sent a verification email to <strong>{user?.email}</strong>. Please check your inbox and click the verification link.
              </p>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-green-300 text-green-700">
                  Check Spam Folder
                </Badge>
                <Badge variant="outline" className="border-green-300 text-green-700">
                  Resend Email
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button 
              onClick={handleResendVerification} 
              disabled={isResending}
              className="w-full"
              variant="outline"
            >
              {isResending ? "Sending..." : "Resend Verification Email"}
            </Button>
            
            <Button 
              onClick={handleManualVerification}
              className="w-full"
            >
              I'll Check My Email
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>After verifying your email, you'll be able to:</p>
            <ul className="mt-2 space-y-1">
              <li className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Book accommodations, tours, and transportation
              </li>
              <li className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Access your booking history
              </li>
              <li className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Manage your profile and preferences
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailVerificationReminder; 