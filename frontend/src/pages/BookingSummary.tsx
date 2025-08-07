import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, CreditCard, Smartphone, Download, MessageCircle, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface BookingItem {
  id: string;
  serviceType: 'ACCOMMODATION' | 'TRANSPORTATION' | 'TOUR';
  serviceName: string;
  details: string;
  dates: string;
  price: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}

interface PaymentMethod {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const BookingSummary = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch booking items from localStorage or context (in real app, from API)
  useEffect(() => {
    // Simulate fetching booking items from context/state
    const storedBookings = localStorage.getItem('currentBookings');
    if (storedBookings) {
      setBookingItems(JSON.parse(storedBookings));
    } else {
      // Fallback mock data
      setBookingItems([
        {
          id: "1",
          serviceType: "ACCOMMODATION",
          serviceName: "Kigali Heights Hotel",
          details: "2 nights • 2 guests • Superior Room",
          dates: "Dec 15-17, 2024",
          price: 240,
          status: "PENDING"
        },
        {
          id: "2",
          serviceType: "TRANSPORTATION",
          serviceName: "Airport Pickup - VIP Vehicle",
          details: "One way • 2 passengers • 2 bags",
          dates: "Dec 15, 2024",
          price: 50,
          status: "PENDING"
        },
        {
          id: "3",
          serviceType: "TOUR",
          serviceName: "Kigali City Tour",
          details: "4 hours • 2 people",
          dates: "Dec 16, 2024",
          price: 90,
          status: "PENDING"
        }
      ]);
    }
    setLoading(false);
  }, []);

  const subtotal = bookingItems.reduce((sum, item) => sum + item.price, 0);
  const serviceFee = Math.round(subtotal * 0.05); // 5% service fee
  const total = subtotal + serviceFee;

  const paymentMethods: PaymentMethod[] = [
    { id: "card", label: "Credit/Debit Card", icon: CreditCard, description: "Visa, Mastercard" },
    { id: "mtn", label: "MTN Mobile Money", icon: Smartphone, description: "Pay with MTN MoMo" },
    { id: "airtel", label: "Airtel Money", icon: Smartphone, description: "Pay with Airtel Money" }
  ];

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to complete your booking",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem("token");
      
      // Create bookings first
      const bookingPromises = bookingItems.map(async (item) => {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            serviceType: item.serviceType,
            serviceId: item.id,
            startDate: new Date().toISOString(), // In real app, get from form
            numberOfPeople: 2, // In real app, get from form
            specialRequests: ""
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create booking for ${item.serviceName}`);
        }
        
        return response.json();
      });

      const bookingResults = await Promise.all(bookingPromises);
      const bookingIds = bookingResults.map(result => result.data.booking.id);

      // Process payment
      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingIds: bookingIds,
          amount: total,
          method: paymentMethod.toUpperCase(),
          currency: "RWF"
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error("Payment processing failed");
      }

      const paymentResult = await paymentResponse.json();
      
      // Clear stored bookings
      localStorage.removeItem('currentBookings');
      
      setIsConfirmed(true);
      toast({
        title: "Payment Successful!",
        description: `Your booking has been confirmed. Payment ID: ${paymentResult.data.payment.id}`,
      });
      
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'ACCOMMODATION':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'TRANSPORTATION':
        return <MessageCircle className="h-4 w-4 text-blue-600" />;
      case 'TOUR':
        return <Download className="h-4 w-4 text-purple-600" />;
      default:
        return <Check className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading booking summary...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Booking Confirmed!</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Your Rwanda adventure is all set. We can't wait to welcome you!
            </p>
            
            <Card className="mb-8 text-left">
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Booking ID:</span>
                    <span className="font-mono">NDH-2024-001234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Paid:</span>
                    <span className="font-bold">RWF {total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Payment Method:</span>
                    <span>{paymentMethods.find(p => p.id === paymentMethod)?.label}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                <Button size="lg" variant="outline" className="flex items-center">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
              <Button variant="ghost" onClick={() => window.location.href = "/dashboard"}>
                View My Bookings
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Booking Summary</h1>
            <p className="text-muted-foreground">Review your selections and complete your booking</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Items */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Selections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bookingItems.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getServiceIcon(item.serviceType)}
                          <div>
                            <h4 className="font-semibold">{item.serviceName}</h4>
                            <p className="text-sm text-muted-foreground">{item.details}</p>
                            <p className="text-sm text-muted-foreground">{item.dates}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">RWF {item.price.toLocaleString()}</p>
                          <Badge variant="secondary">{item.serviceType}</Badge>
                        </div>
                      </div>
                      {index < bookingItems.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Payment Section */}
            <div className="space-y-6">
              {/* Price Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Price Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>RWF {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Fee (5%)</span>
                    <span>RWF {serviceFee.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>RWF {total.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                          <div key={method.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={method.id} id={method.id} />
                            <Label htmlFor={method.id} className="flex items-center space-x-2 cursor-pointer">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{method.label}</div>
                                <div className="text-sm text-muted-foreground">{method.description}</div>
                              </div>
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Pay Button */}
              <Button 
                onClick={handlePayment} 
                disabled={isProcessing || !paymentMethod}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  `Pay RWF ${total.toLocaleString()}`
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By completing this booking, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BookingSummary;