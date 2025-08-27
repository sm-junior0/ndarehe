import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const BookingFailed = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Failed Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-red-600 mb-2">Payment Failed</h1>
            <p className="text-muted-foreground">
              We couldn't process your payment. Don't worry, your booking hasn't been confirmed yet.
            </p>
          </div>

          {/* Error Details Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                What Happened?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  Your payment could not be completed. This could be due to:
                </p>
                <ul className="list-disc list-inside text-sm text-red-600 mt-2 space-y-1">
                  <li>Insufficient funds in your account</li>
                  <li>Card declined by your bank</li>
                  <li>Network connectivity issues</li>
                  <li>Payment timeout</li>
                  <li>Invalid payment details</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Good news:</strong> Your booking is still available and hasn't been confirmed yet. 
                  You can try the payment again or contact our support team for assistance.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>What Can You Do?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-medium text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium">Try Again</p>
                  <p className="text-sm text-muted-foreground">
                    Go back to your booking and attempt the payment again. Sometimes a second attempt works.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-medium text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-medium">Check Your Payment Method</p>
                  <p className="text-sm text-muted-foreground">
                    Verify your card details, ensure sufficient funds, or try a different payment method.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-medium text-blue-600">3</span>
                </div>
                <div>
                  <p className="font-medium">Contact Support</p>
                  <p className="text-sm text-muted-foreground">
                    Our support team is available 24/7 to help resolve payment issues.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1">
              <Link to="/accommodations">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Accommodations
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/dashboard">
                <RefreshCw className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
          </div>

          {/* Support Information */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Need immediate assistance?
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
              <span className="text-blue-600">📧 support@ndarehe.com</span>
              <span className="text-blue-600">📞 +250 788 123 456</span>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BookingFailed;
