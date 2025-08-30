import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Star, Users, ArrowLeft, Check, Phone, Globe } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { bookingsApi, accommodationsApi, paymentsApi, stripeApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import EmailVerificationReminder from "@/components/EmailVerificationReminder";

interface Accommodation {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  isAvailable?: boolean;
  pricePerNight: number;
  currency: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  phone: string;
  email: string;
  website: string;
  address: string;
  averageRating: number;
  contactNumbers?: string[];
  roomTypes?: Array<{
    id?: string;
    name: string;
    description?: string;
    capacity?: number;
    pricePerNight: number;
    currency?: string;
    amenities?: string[];
    images?: string[];
  }>;
  seasonalRates?: Array<{
    season: string;
    startDate?: string;
    endDate?: string;
    pricePerNight: number;
    currency?: string;
  }>;
  specialOffers?: Array<{
    title: string;
    description?: string;
    price?: number;
    currency?: string;
    startDate?: string;
    endDate?: string;
  }>;
  location: {
    id: string;
    name: string;
    city: string;
    district: string;
    province: string;
    latitude: number;
    longitude: number;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    user: {
      firstName: string;
      lastName: string;
      profileImage: string;
    };
  }>;
}

// Distance Information Component
interface DistanceInfoProps {
  accommodationName: string;
  location: string;
}

const DistanceInfo = ({ accommodationName, location }: DistanceInfoProps) => {
  const getDistances = () => {
    const distances: Record<string, { km: number; time: string }> = {
      "Highlands Suites Hotel": { km: 12.5, time: "20-25 min" },
      "Ndaru Luxury Suites by Le Muguet": { km: 13.2, time: "25-30 min" },
      "Lexor Apartments": { km: 11.8, time: "20-25 min" },
      "Oasis Park": { km: 10.5, time: "18-22 min" },
      "Madras Hotel and Apartments": { km: 9.8, time: "15-20 min" },
      "Grazia Apartment Hotel": { km: 12.1, time: "20-25 min" },
      "Great Seasons Hotel": { km: 11.3, time: "18-23 min" },
      "Vista Luxury Apartment": { km: 11.5, time: "19-24 min" }
    };

    return distances[accommodationName] || { km: 12, time: "20-25 min" };
  };


  const distanceToAirport = getDistances();
  const distanceToCityCenter = Math.round(distanceToAirport.km * 0.7);
  const distanceToConvention = Math.round(distanceToAirport.km * 0.8);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-600" />
          Distance Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{distanceToAirport.km} km</div>
            <div className="text-sm text-muted-foreground">to Kigali International Airport</div>
            <div className="text-xs mt-1 text-green-600">({distanceToAirport.time} drive)</div>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{distanceToCityCenter} km</div>
            <div className="text-sm text-muted-foreground">to Kigali City Center</div>
            <div className="text-xs mt-1 text-blue-600">(15-20 min drive)</div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">{distanceToConvention} km</div>
            <div className="text-sm text-muted-foreground">to Kigali Convention Centre</div>
            <div className="text-xs mt-1 text-purple-600">(18-22 min drive)</div>
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          <p>Note: Distances are approximate and may vary based on traffic conditions.</p>
        </div>
      </CardContent>
    </Card>
  );
};

const AccommodationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const inDashboard = location.pathname.startsWith('/dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<'VISA' | 'MASTERCARD' | 'MOMO'>('VISA');
  const [selectedBank, setSelectedBank] = useState<'Bank of Kigali' | "I&M Bank" | 'Equity Bank'>('Bank of Kigali');
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [txRef, setTxRef] = useState<string | null>(null);
  const [card, setCard] = useState({
    holder: "",
    number: "",
    expiry: "",
    cvc: "",
  });
  const [momo, setMomo] = useState({
    phone: "",
    name: "",
    reference: "",
  });
  const [booking, setBooking] = useState({
    checkIn: "",
    checkOut: "",
    guests: "1",
    specialRequests: ""
  });
  const [showVerificationReminder, setShowVerificationReminder] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const nights = booking.checkIn && booking.checkOut
    ? Math.max(1, Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const guestsCount = parseInt(booking.guests || '1', 10) || 1;

  useEffect(() => {
    const fetchAccommodation = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const response = await accommodationsApi.getById(id);

        if (response.success) {
          setAccommodation(response.data.accommodation);
        } else {
          setError("Failed to load accommodation details");
        }
      } catch (error: unknown) {
        console.error("Error fetching accommodation:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load accommodation details";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAccommodation();
  }, [id]);


  // Hotel-specific details mapping
  const hotelDetailsMap: Record<string, {
    roomTypes: Array<{ name: string; price: number; description?: string }>;
    hasFreeAirportPickup: boolean;
    hasInclusiveBreakfast: boolean;
    hasKitchen: boolean;
    specialNotes: string;
  }> = {
    "Great Seasons Hotel": {
      roomTypes: [
        { name: "Standard", price: 70, description: "Comfortable standard room" },
        { name: "Junior Suite", price: 100, description: "Spacious junior suite" },
        { name: "Superior", price: 150, description: "Premium superior room" }
      ],
      hasFreeAirportPickup: true,
      hasInclusiveBreakfast: true,
      hasKitchen: false,
      specialNotes: "All room types include breakfast and free airport pickup. No kitchen facilities available."
    },
    "Highlands Suites Hotel": {
      roomTypes: [
        { name: "2 Bedroom", price: 180, description: "Two bedroom suite" },
        { name: "Single", price: 100, description: "Single room" }
      ],
      hasFreeAirportPickup: false, // $25 charge
      hasInclusiveBreakfast: true,
      hasKitchen: false,
      specialNotes: "Includes breakfast. Airport pickup available for $25."
    },
    "Vista Luxury Apartment": {
      roomTypes: [
        { name: "2 Bedroom", price: 100, description: "5 units available with kitchen" },
        { name: "1 Bedroom", price: 80, description: "1 unit with kitchen" }
      ],
      hasFreeAirportPickup: false,
      hasInclusiveBreakfast: false,
      hasKitchen: true,
      specialNotes: "Kitchen available in all units. No free airport pickup or inclusive breakfast."
    },
    "Grazia Apartment Hotel": {
      roomTypes: [
        { name: "2 Bedroom with Kitchen", price: 300, description: "With kitchen facilities" },
        { name: "1 Bedroom with Kitchen", price: 200, description: "With kitchen facilities" },
        { name: "1 Bedroom without Kitchen", price: 110, description: "Standard room" },
        { name: "Standard", price: 119, description: "Basic standard room" },
        { name: "Twin", price: 160, description: "Twin beds" },
        { name: "Superior Double", price: 150, description: "Premium double room" }
      ],
      hasFreeAirportPickup: false,
      hasInclusiveBreakfast: false,
      hasKitchen: true, // Some units have kitchen
      specialNotes: "Kitchen available in some units. Check room types for details."
    },
    "Ndaru Luxury Suites": {
      roomTypes: [
        { name: "Executive suite", price: 185, description: "1 queen bed" },
        { name: "Deluxe Apartment", price: 230, description: "1 queen bed , 1 king bed" },
        { name: "Deluxe Double Room", price: 104, description: "1 queen bed" },
        { name: "Deluxe Twin Room", price: 114, description: "2 twins beds" },
        { name: "Deluxe Single Room", price: 85, description: "1 twin bed" },
      ], // Add room types if available
      hasFreeAirportPickup: true,
      hasInclusiveBreakfast: true,
      hasKitchen: false,
      specialNotes: "Free airport pickup and inclusive breakfast included."
    },
    "Lexor Apartments": {
      roomTypes: [
        { name: "1 bedroom", price: 120, description: "1 queen bed" },
        { name: "2 bedrooms", price: 136, description: "2 queen beds" },
      ], // Add room types if available
      hasFreeAirportPickup: false,
      hasInclusiveBreakfast: false,
      hasKitchen: false,
      specialNotes: "No inclusive breakfast included."
    },
    "Oasis Park": {
      roomTypes: [
        { name: "2 Bedrooms Comfort Shared Dormitory Garden View", price: 61.20, description: "2 queen bed" },
        { name: "Deluxe Studio 1 King Bed", price: 103.50, description: "1 King Bed" },
        { name: "Signature Apartment 2 Bedrooms Garden View", price: 145.01, description: "1 king bed and 1 queen bed" },
        { name: "Comfort Apartment", price: 155.93, description: "1 king bed and 1 queen bed" },
        { name: "Superior Apartment", price: 222.76, description: "1 full bed and 2 king bed" },
        { name: "Elite Apartment", price: 356.41, description: "1 king bed and 3 queen bed" }
      ], // Add room types if available
      hasFreeAirportPickup: false,
      hasInclusiveBreakfast: true,
      hasKitchen: false,
      specialNotes: "No inclusive breakfast included."
    },
    "Madras Hotel and Apartments": {
      roomTypes: [
        { name: "Standard Double Room", price: 70, description: "1 full bed" },
        { name: "One-Bedroom Apartment", price: 110, description: "1 full bed , 1 sofa bed" },
        { name: "Two-Bedroom Apartment", price: 210, description: "1 full bed , 1 sofa bed" },
      ], // Add room types if available
      hasFreeAirportPickup: false,
      hasInclusiveBreakfast: true,
      hasKitchen: false,
      specialNotes: "Contact for specific room details and amenities."
    }
  };

  // Helper function to get hotel details
  const getHotelDetails = (hotelName: string) => {
    return hotelDetailsMap[hotelName] || {
      roomTypes: [],
      hasFreeAirportPickup: false,
      hasInclusiveBreakfast: false,
      hasKitchen: false,
      specialNotes: "Contact for specific room details and amenities."
    };
  };

  // In your AccommodationDetails component
  const handleStripePayment = async () => {
    console.log('🔵 handleFlutterwavePayment called!');
    console.log('🔵 accommodation:', accommodation);
    console.log('🔵 booking:', booking);
    console.log('🔵 paymentProvider:', paymentProvider);
    
    if (!accommodation) {
      console.log('❌ No accommodation data');
      return;
    }

    try {
      console.log('🔵 Setting isPaying to true');
      setIsPaying(true);

      // Auth and validation
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ title: 'Authentication Required', description: 'Please log in to proceed with payment', variant: 'destructive' });
        return;
      }
      if (new Date(booking.checkOut) <= new Date(booking.checkIn)) {
        toast({ title: 'Invalid Dates', description: 'Check-out date must be after check-in date', variant: 'destructive' });
        return;
      }

      // Validate payment method specific fields
      if (paymentProvider === 'MOMO') {
        if (!momo.phone || !momo.name) {
          toast({ title: 'Missing Information', description: 'Please provide your MoMo phone number and account name', variant: 'destructive' });
          return;
        }
      }

      // 1) Create booking (PENDING)
      const bookingRes = await bookingsApi.create({
        serviceType: 'ACCOMMODATION',
        serviceId: accommodation.id,
        startDate: booking.checkIn,
        endDate: booking.checkOut,
        numberOfPeople: parseInt(booking.guests || '1', 10),
        specialRequests: booking.specialRequests || ''
      });
      if (!bookingRes.success) throw new Error('Failed to create booking');
      const newBooking = bookingRes.data.booking;

      // 2) Compute amount
      const checkInDate = new Date(booking.checkIn);
      const checkOutDate = new Date(booking.checkOut);
      const msPerDay = 1000 * 60 * 60 * 24;
      const rawNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / msPerDay);
      const nights = Math.max(1, rawNights);
      const guests = parseInt(booking.guests) || 1;
      const amount = nights * guests * (accommodation.pricePerNight || 0);

      // 3) Prepare customer (Stripe Checkout)
      const customer = {
        email: user?.email || 'guest@example.com',
        name: `${user?.firstName || 'Guest'} ${user?.lastName || ''}`.trim(),
      } as { email: string; name: string };

      // 4) Initialize Stripe session via backend
      const initRes = await stripeApi.init({
        bookingId: newBooking.id,
        amount,
        currency: accommodation.currency || 'RWF',
        customer,
      });

      if (initRes.success && initRes.link) {
        setPaymentLink(initRes.link);
        if (initRes.tx_ref) setTxRef(initRes.tx_ref);
        
        console.log('[Stripe] Checkout link:', initRes.link, 'tx_ref:', initRes.tx_ref);
        
        // Open Stripe payment page in same tab
        window.location.href = initRes.link;
        
        toast({
          title: 'Payment Page Opened',
          description: 'Complete your payment in the opened page, then return here and click "Verify Payment"',
          variant: 'default',
        });
      } else {
        throw new Error(initRes.message || 'Failed to initiate payment');
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      toast({ title: 'Payment Error', description: error.message || 'Failed to initiate payment', variant: 'destructive' });
    } finally {
      setIsPaying(false);
    }
  };

  const verifyPayment = async () => {
    if (!txRef) {
      toast({ title: 'Missing reference', description: 'Start payment first to get a transaction reference.', variant: 'destructive' });
      return;
    }

    try {
      setIsPaying(true);
      console.log('[Payment] Verifying payment for tx_ref:', txRef);
      
      const data = await stripeApi.verifyJson(txRef);

      if (data.success && data.paid) {
        setPaymentVerified(true);
        toast({
          title: 'Payment Verified Successfully!',
          description: 'Your payment has been confirmed. You can now proceed with your booking.',
          variant: 'default'
        });
        console.log('[Payment] ✅ Payment verified successfully');
      } else {
        throw new Error('Payment not verified yet. Please complete the payment and try again.');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Payment not verified. Please complete the payment first.',
        variant: 'destructive'
      });
    } finally {
      setIsPaying(false);
    }
  };

  const handleBookingAndPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accommodation) return;

    if (!paymentVerified) {
      toast({ title: 'Payment Required', description: 'Please complete and verify your payment first.', variant: 'destructive' });
      return;
    }

    if (new Date(booking.checkOut) <= new Date(booking.checkIn)) {
      toast({ title: 'Invalid Dates', description: 'Check-out date must be after check-in date', variant: 'destructive' });
      return;
    }

    if (user && !user.isVerified) {
      setShowVerificationReminder(true);
      return;
    }

    try {
      setSubmitting(true);
      // At this point, the backend verification endpoint already confirmed the booking and updated payment/booking status.
      setSuccess(true);
      toast({
        title: 'Booking Confirmed!',
        description: 'Your payment was verified and booking is confirmed. Check your email for details.',
        variant: 'default'
      });
      console.log('[Booking] ✅ Booking confirmed successfully');
    } catch (error: unknown) {
      console.error('Booking confirmation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unable to finalize booking';
      toast({ title: 'Confirmation Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    const content = (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );

    return inDashboard ? content : (
      <div className="min-h-screen bg-background">
        <Header />
        {content}
        <Footer />
      </div>
    );
  }

  if (error || !accommodation) {
    const content = (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Accommodation Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "The accommodation you're looking for doesn't exist."}
          </p>
          <Button asChild>
            <Link to={inDashboard ? "/dashboard/accommodations" : "/accommodations"}>
              Back to Accommodations
            </Link>
          </Button>
        </div>
      </div>
    );

    return inDashboard ? content : (
      <div className="min-h-screen bg-background">
        <Header />
        {content}
        <Footer />
      </div>
    );
  }

  const mainContent = (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to={inDashboard ? "/dashboard/accommodations" : "/accommodations"}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Accommodations
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-4xl font-bold mb-4">{accommodation.name}</h1>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{accommodation.location.city}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-muted-foreground">{accommodation.averageRating}</span>
            </div>
            <Badge variant="secondary">{accommodation.type}</Badge>
            <Badge variant="outline">{accommodation.category}</Badge>
            <Badge variant={accommodation.isAvailable === false ? 'destructive' : 'secondary'}>
              {accommodation.isAvailable === false ? 'Full' : 'Available'}
            </Badge>
          </div>

          {accommodation.images && accommodation.images.length > 0 && (
            <div className="mb-6">
              <img
                src={accommodation.images[0]}
                alt={accommodation.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Distance Information Component */}
          <DistanceInfo
            accommodationName={accommodation.name}
            location={accommodation.location.city}
          />

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>About this accommodation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{accommodation.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Max {accommodation.maxGuests} guests</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{accommodation.bedrooms} bedrooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{accommodation.bathrooms} bathrooms</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>
                    {accommodation.contactNumbers?.length
                      ? accommodation.contactNumbers.join(' • ')
                      : accommodation.phone || '—'}
                  </span>
                </div>
                {accommodation.website && (
                  <a href={accommodation.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-green-700 hover:underline">
                    <Globe className="h-4 w-4" />
                    Visit website
                  </a>
                )}
              </div>

              {accommodation.amenities && accommodation.amenities.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {accommodation.amenities.map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {accommodation.roomTypes && accommodation.roomTypes.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Room types</h4>
                  <div className="space-y-3">
                    {accommodation.roomTypes.map((room, idx) => (
                      <div key={room.id || idx} className="flex items-start justify-between gap-4 border rounded-md p-3">
                        <div>
                          <p className="font-medium">{room.name}</p>
                          {room.description && <p className="text-sm text-muted-foreground">{room.description}</p>}
                          {room.capacity && (
                            <p className="text-xs text-muted-foreground">Sleeps up to {room.capacity} guests</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{room.currency || accommodation.currency} {room.pricePerNight.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {accommodation.specialOffers && accommodation.specialOffers.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Special offers</h4>
                  <div className="space-y-3">
                    {accommodation.specialOffers.map((offer, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-4 border rounded-md p-3 bg-green-50">
                        <div>
                          <p className="font-medium">{offer.title}</p>
                          {offer.description && <p className="text-sm text-muted-foreground">{offer.description}</p>}
                        </div>
                        {offer.price && (
                          <div className="text-right">
                            <p className="font-semibold">{offer.currency || accommodation.currency} {offer.price.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {accommodation.reviews && accommodation.reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accommodation.reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          by {review.user.firstName} {review.user.lastName}
                        </span>
                      </div>
                      <p className="text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Book this accommodation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold">{accommodation.currency} {accommodation.pricePerNight.toLocaleString()}</div>
                <div className="text-muted-foreground">per person per night</div>
              </div>

              <Button className="w-full" size="lg" onClick={() => setModalOpen(true)}>
                Book Now
              </Button>
            </CardContent>
          </Card>

          {/* Additional Hotel Information Card */}
          {/* Additional Hotel Information Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Hotel Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Get hotel-specific details */}
              {(() => {
                const hotelDetails = getHotelDetails(accommodation.name);

                return (
                  <>
                    {/* Room Types */}
                    {hotelDetails.roomTypes.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Room Types & Prices</h4>
                        <div className="space-y-2">
                          {hotelDetails.roomTypes.map((room, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <div>
                                <span className="font-medium">{room.name}</span>
                                {room.description && (
                                  <p className="text-xs text-muted-foreground">{room.description}</p>
                                )}
                              </div>
                              <span className="font-semibold">
                                {accommodation.currency} {room.price.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Amenities & Services */}
                    <div>
                      <h4 className="font-semibold mb-2">Services Included</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          {hotelDetails.hasFreeAirportPickup ? (
                            <>
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">Free Airport Pickup</span>
                            </>
                          ) : (
                            <>
                              <span className="text-muted-foreground">✗</span>
                              <span className="text-muted-foreground">No Free Airport Pickup</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {hotelDetails.hasInclusiveBreakfast ? (
                            <>
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">Inclusive Breakfast</span>
                            </>
                          ) : (
                            <>
                              <span className="text-muted-foreground">✗</span>
                              <span className="text-muted-foreground">No Inclusive Breakfast</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {hotelDetails.hasKitchen ? (
                            <>
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">Kitchen Available</span>
                            </>
                          ) : (
                            <>
                              <span className="text-muted-foreground">✗</span>
                              <span className="text-muted-foreground">No Kitchen</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Special Notes */}
                    {hotelDetails.specialNotes && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>Special Note:</strong> {hotelDetails.specialNotes}
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/30">
          {!success ? (
            <form onSubmit={handleBookingAndPayment} className="space-y-4">
              <DialogHeader>
                <div className="flex items-start gap-4">
                  {accommodation.images?.length > 0 && (
                    <img
                      src={accommodation.images[0]}
                      alt={accommodation.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <DialogTitle>{accommodation.name}</DialogTitle>
                    <DialogDescription>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {accommodation.location.city} • {accommodation.type}
                      </div>
                      <div className="flex items-center mt-1">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        {accommodation.averageRating} • {accommodation.currency}{" "}
                        {accommodation.pricePerNight.toLocaleString()}/night per person
                      </div>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Booking Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkIn">Check-In Date</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={booking.checkIn}
                    onChange={e => setBooking({ ...booking, checkIn: e.target.value })}
                    className="focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="checkOut">Check-Out Date</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={booking.checkOut}
                    onChange={e => setBooking({ ...booking, checkOut: e.target.value })}
                    className="focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </div>
              </div>

              {/* Guests */}
              <div>
                <Label htmlFor="guests">Number of Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  min={1}
                  max={accommodation.maxGuests}
                  value={booking.guests}
                  onChange={e => setBooking({ ...booking, guests: e.target.value })}
                  className="focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
              </div>

              {/* Special Requests */}
              <div className="mb-4">
                <Label htmlFor="specialRequests">Special Requests</Label>
                <textarea
                  id="specialRequests"
                  value={booking.specialRequests}
                  onChange={e => setBooking({ ...booking, specialRequests: e.target.value })}
                  className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <h4 className="font-semibold">Payment Method</h4>
                <div className="flex items-center gap-4">
                  {["VISA", "MASTERCARD", "MOMO"].map(provider => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => setPaymentProvider(provider as "VISA" | "MASTERCARD" | "MOMO")}
                      className={`rounded border p-1 transition ${paymentProvider === provider ? "ring-2 ring-green-600" : "border-input"}`}
                      aria-label={`Pay with ${provider}`}
                    >
                      <img
                        src={`/logos/${provider.toLowerCase()}.svg`}
                        alt={provider}
                        className="h-6"
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Unit price: {accommodation.currency} {accommodation.pricePerNight.toLocaleString()} per person per night
                </p>
                <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  💳 You'll be redirected to Flutterwave's secure payment page to complete your transaction.
                </p>
              </div>

              {/* Total Calculation */}
              {(() => {
                const hasDates = booking.checkIn && booking.checkOut;
                const nights = hasDates ? Math.max(1, Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))) : 0;
                const guests = parseInt(booking.guests || "1", 10) || 1;
                const baseTotal = nights * guests * (accommodation.pricePerNight || 0);
                const stripeFee = baseTotal * 0.05;
                const total = baseTotal + stripeFee;
                return (
                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {nights > 0 ? `Total for ${guests} guest${guests > 1 ? "s" : ""} over ${nights} night${nights > 1 ? "s" : ""}` : `Total for ${guests} guest${guests > 1 ? "s" : ""}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Rate: {accommodation.currency} {accommodation.pricePerNight.toLocaleString()} per person per night
                          {nights > 0 && (
                            <>
                              <br />
                              Base: {accommodation.currency} {baseTotal.toLocaleString()}
                              <br />
                              Stripe fee (5%): {accommodation.currency} {stripeFee.toLocaleString()}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        {nights > 0 ? (
                          <>
                            <p className="text-xl font-bold">{accommodation.currency} {total.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Includes 5% fee</p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Select dates</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Payment Actions */}
              <div className="space-y-4">
                {/* Step 1: Initiate Payment */}
                <div className="space-y-2">
                  <Button 
                    type="button" 
                    className="w-full" 
                    onClick={() => {
                      console.log('🔴 Button clicked!');
                      handleStripePayment();
                    }} 
                    disabled={isPaying}
                  >
                    {isPaying ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </div>
                    ) : (
                      `Pay with ${paymentProvider === 'MOMO' ? 'MTN/Airtel' : 'Card'} (Stripe)`
                    )}
                  </Button>
                  
                  {txRef && (
                    <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                      Transaction Reference: {txRef}
                    </div>
                  )}
                </div>

                {/* Step 2: Verify Payment */}
                {txRef && (
                  <div className="space-y-2">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="w-full"
                      onClick={verifyPayment} 
                      disabled={isPaying || paymentVerified}
                    >
                      {isPaying ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          Verifying...
                        </div>
                      ) : paymentVerified ? (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Payment Verified
                        </div>
                      ) : (
                        'Verify Payment'
                      )}
                    </Button>
                    
                    {!paymentVerified && txRef && (
                      <div className="text-xs text-muted-foreground">
                        After completing payment, click "Verify Payment" to confirm
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Status */}
                {paymentVerified && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-700">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">Payment Verified Successfully!</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Your payment has been confirmed. You can now proceed with your booking.
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm after verification */}
              <Button
                type="submit"
                className="w-full"
                disabled={!paymentVerified || submitting}
                variant={paymentVerified ? "default" : "secondary"}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Confirming...
                  </div>
                ) : (
                  paymentVerified ? 'Confirm and Continue' : 'Complete Payment First'
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-6 py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
              <p>Your stay at <span className="font-semibold">{accommodation.name}</span> is confirmed.</p>
              <p className="text-muted-foreground">Check your email for confirmation details.</p>
              <Button className="w-full" onClick={() => setModalOpen(false)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EmailVerificationReminder
        isOpen={showVerificationReminder}
        onClose={() => setShowVerificationReminder(false)}
      />
    </main>
  );

  return inDashboard ? (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {mainContent}
    </div>
  ) : (
    <div className="min-h-screen bg-background">
      <Header />
      {mainContent}
      <Footer />
    </div>
  );
};

export default AccommodationDetails;