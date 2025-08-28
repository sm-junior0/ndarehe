import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Calendar, Users, MapPin, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { bookingsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  numberOfPeople: number;
  totalAmount: number;
  currency: string;
  status: string;
  accommodation?: {
    name: string;
    type: string;
    images: string[];
    location: {
      city: string;
      district: string;
    };
  };
  transportation?: {
    name: string;
    type: string;
    images: string[];
    location: {
      city: string;
      district: string;
    };
  };
  tour?: {
    name: string;
    type: string;
    images: string[];
    location: {
      city: string;
      district: string;
    };
  };
}

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  const bookingId = searchParams.get('bookingId');

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setError("No booking ID provided");
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching booking with ID:', bookingId);
        const response = await bookingsApi.getById(bookingId);
        console.log('📡 API Response:', response);
        
        if (response.success && response.data?.booking) {
          setBooking(response.data.booking);
          console.log('✅ Booking data loaded successfully:', response.data.booking);
        } else {
          console.warn('⚠️ API response missing booking data:', response);
          // Don't set error, just show the generic success message
          setError(null);
        }
      } catch (error) {
        console.error("❌ Error fetching booking:", error);
        // Don't set error, just show the generic success message
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // If there's an error or no booking data, show a generic success message
  // This can happen if the user is redirected here after payment but before the booking is fully processed
  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground">
                Your payment has been processed successfully. Your booking is being confirmed.
              </p>
            </div>

            {/* Generic Success Message */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  What Happens Next?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700">
                    <strong>Great news!</strong> Your payment has been received and your booking is being processed.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-medium text-blue-600">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Payment Confirmed</p>
                      <p className="text-sm text-muted-foreground">
                        Your payment has been verified and processed successfully.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-medium text-blue-600">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Booking Processing</p>
                      <p className="text-sm text-muted-foreground">
                        Your booking is being confirmed and dates are being reserved.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-medium text-blue-600">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Confirmation Email</p>
                      <p className="text-sm text-muted-foreground">
                        You'll receive a confirmation email with all the details shortly.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="flex-1">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/accommodations">Book Another Stay</Link>
              </Button>
            </div>

            {/* Support Information */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Need immediate assistance?
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
                <span className="text-blue-600">📧 support@ndarehe.com</span>
                <span className="text-blue-600">📞 +250 785 845 701</span>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const service = booking.accommodation || booking.transportation || booking.tour;
  const serviceType = booking.accommodation ? 'Accommodation' : booking.transportation ? 'Transportation' : 'Tour';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Your {serviceType.toLowerCase()} has been confirmed and payment received.
            </p>
          </div>

          {/* Booking Details Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {service && (
                <div className="flex items-start gap-4">
                  {service.images && service.images.length > 0 && (
                    <img
                      src={service.images[0]}
                      alt={service.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{service.name}</h3>
                    <p className="text-muted-foreground">{service.type}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{service.location.city}, {service.location.district}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Check-in Date</p>
                  <p className="font-medium">
                    {new Date(booking.startDate).toLocaleDateString()}
                  </p>
                </div>
                {booking.endDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Check-out Date</p>
                    <p className="font-medium">
                      {new Date(booking.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Number of People</p>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {booking.numberOfPeople}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium text-lg">
                    {booking.currency} {booking.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Booking Status: Confirmed</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Your payment has been verified and your booking is now confirmed.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-medium text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium">Check Your Email</p>
                  <p className="text-sm text-muted-foreground">
                    We've sent you a confirmation email with all the details.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-medium text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-medium">View Your Booking</p>
                  <p className="text-sm text-muted-foreground">
                    Access your booking details anytime from your dashboard.
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
                    Need help? Our support team is available 24/7.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/accommodations">Book Another Stay</Link>
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BookingSuccess;
