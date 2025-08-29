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
import { bookingsApi, accommodationsApi, paymentsApi, flutterwaveApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import EmailVerificationReminder from "@/components/EmailVerificationReminder";

interface Accommodation {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
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
  const [flutterwaveLink, setFlutterwaveLink] = useState<string | null>(null);
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


// In your AccommodationDetails component
const handleFlutterwavePayment = async () => {
  console.log('🔵 handleFlutterwavePayment called!');
  
  if (!accommodation) {
    console.log('❌ No accommodation data');
    return;
  }

  try {
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

    // 1) Create booking (TEMPORARY status)
    const bookingRes = await bookingsApi.create({
      serviceType: 'ACCOMMODATION',
      serviceId: accommodation.id,
      startDate: booking.checkIn,
      endDate: booking.checkOut,
      numberOfPeople: parseInt(booking.guests || '1', 10),
      specialRequests: booking.specialRequests || ''
    });
    
    if (!bookingRes.success) {
      console.error('Booking creation failed:', bookingRes);
      throw new Error('Failed to create booking');
    }
    
    const newBooking = bookingRes.data.booking;
    console.log('✅ Booking created successfully:', newBooking);

    // 2) Compute amount
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const msPerDay = 1000 * 60 * 60 * 24;
    const rawNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / msPerDay);
    const nights = Math.max(1, rawNights);
    const guests = parseInt(booking.guests) || 1;
    const amount = nights * guests * (accommodation.pricePerNight || 0);

    console.log('💰 Payment details:', { nights, guests, amount, currency: accommodation.currency });

    // 3) Prepare customer (Flutterwave Hosted Pay)
    const customer = {
      email: user?.email || 'guest@example.com',
      name: `${user?.firstName || 'Guest'} ${user?.lastName || ''}`.trim(),
      phonenumber: paymentProvider === 'MOMO' ? momo.phone : undefined,
    };

    console.log('👤 Customer details:', customer);

    // 4) Initialize Flutterwave session via backend
    console.log('🚀 Initializing Flutterwave payment...');
    console.log('📤 Sending payload to backend:', {
      bookingId: newBooking.id,
      amount,
      currency: accommodation.currency || 'RWF',
      customer,
    });
    
    const initRes = await flutterwaveApi.init({
      bookingId: newBooking.id,
      amount,
      currency: accommodation.currency || 'RWF',
      customer,
    });

    console.log('📡 Flutterwave init response:', initRes);

    if (initRes.success && initRes.link) {
      const paymentLink = initRes.link;
      const transactionRef = initRes.tx_ref;
      
      setFlutterwaveLink(paymentLink);
      if (transactionRef) setTxRef(transactionRef);
      
      console.log('✅ Flutterwave payment initialized successfully');
      console.log('🔗 Payment link:', paymentLink);
      console.log('📝 Transaction ref:', transactionRef);
      
      // Open Flutterwave payment page in a new tab/window
      const paymentWindow = window.open(paymentLink, '_blank', 'noopener,noreferrer');
      
      if (paymentWindow) {
        toast({
          title: 'Payment Page Opened',
          description: 'Complete your payment in the new tab, then return here and click "Verify Payment"',
          variant: 'default',
        });
        
        // Focus the payment window
        paymentWindow.focus();
      } else {
        // Fallback if popup is blocked
        toast({
          title: 'Popup Blocked',
          description: 'Please allow popups and try again, or copy this link: ' + paymentLink,
          variant: 'destructive',
        });
      }
    } else {
      console.error('❌ Flutterwave init failed:', initRes);
      throw new Error(initRes.message || 'Failed to initiate payment - no payment link received');
    }
  } catch (error: unknown) {
    console.error('Payment initialization error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment';
    toast({ title: 'Payment Error', description: errorMessage, variant: 'destructive' });
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
      
      const data = await flutterwaveApi.verifyJson(txRef);

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
    } catch (error: unknown) {
      console.error('Payment verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment not verified. Please complete the payment first.';
      toast({
        title: 'Verification Failed',
        description: errorMessage,
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
<Card className="mt-6">
  <CardHeader>
    <CardTitle>Hotel Details</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Room Types */}
    {accommodation.roomTypes && accommodation.roomTypes.length > 0 && (
      <div>
        <h4 className="font-semibold mb-2">Room Types & Prices</h4>
        <div className="space-y-2">
          {accommodation.roomTypes.map((room, idx) => (
            <div key={room.id || idx} className="flex justify-between items-center text-sm">
              <span>{room.name}</span>
              <span className="font-semibold">
                {room.currency || accommodation.currency} {room.pricePerNight.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Amenities & Services */}
    <div>
      <h4 className="font-semibold mb-2">Services Included</h4>
      <div className="space-y-1 text-sm">
        {/* Check for free airport pickup */}
        {accommodation.amenities?.some(amenity => 
          amenity.toLowerCase().includes('airport') || 
          amenity.toLowerCase().includes('pickup')
        ) ? (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-4 w-4" />
            <span>Free Airport Pickup</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>✗</span>
            <span>No Free Airport Pickup</span>
          </div>
        )}

        {/* Check for inclusive breakfast */}
        {accommodation.amenities?.some(amenity => 
          amenity.toLowerCase().includes('breakfast') || 
          amenity.toLowerCase().includes('meal')
        ) ? (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-4 w-4" />
            <span>Inclusive Breakfast</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>✗</span>
            <span>No Inclusive Breakfast</span>
          </div>
        )}

        {/* Check for kitchen */}
        {accommodation.amenities?.some(amenity => 
          amenity.toLowerCase().includes('kitchen') || 
          amenity.toLowerCase().includes('cooking')
        ) ? (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-4 w-4" />
            <span>Kitchen Available</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>✗</span>
            <span>No Kitchen</span>
          </div>
        )}
      </div>
    </div>

    {/* Special Notes based on hotel name */}
    {accommodation.name.includes("Great Seasons") && (
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Special Note:</strong> All room types include breakfast and free airport pickup. No kitchen facilities available.
        </p>
      </div>
    )}

    {accommodation.name.includes("Highlands Suites") && (
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Special Note:</strong> Includes breakfast. Airport pickup available for $25.
        </p>
      </div>
    )}

    {accommodation.name.includes("Vista Luxury") && (
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Special Note:</strong> Kitchen available in all units. No free airport pickup or inclusive breakfast.
        </p>
      </div>
    )}

    {accommodation.name.includes("Grazia") && (
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Special Note:</strong> Kitchen available in some units. Check room types for details.
        </p>
      </div>
    )}

    {accommodation.name.includes("Ndaru") && (
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Special Note:</strong> Free airport pickup and inclusive breakfast included.
        </p>
      </div>
    )}

    {(accommodation.name.includes("Oasis") || accommodation.name.includes("Lexor")) && (
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Special Note:</strong> No inclusive breakfast included.
        </p>
      </div>
    )}
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
                  placeholder="Any special requirements..."
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
                const total = nights * guests * (accommodation.pricePerNight || 0);
                return (
                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {nights > 0 ? `Total for ${guests} guest${guests > 1 ? "s" : ""} over ${nights} night${nights > 1 ? "s" : ""}` : `Total for ${guests} guest${guests > 1 ? "s" : ""}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Rate: {accommodation.currency} {accommodation.pricePerNight.toLocaleString()} per person per night{nights > 0 ? ". Includes all taxes and fees." : ". Select dates to see total."}
                        </p>
                      </div>
                      <div className="text-right">
                        {nights > 0 ? <p className="text-xl font-bold">{accommodation.currency} {total.toLocaleString()}</p> : <p className="text-sm text-muted-foreground">Select dates</p>}
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
                      handleFlutterwavePayment();
                    }} 
                    disabled={isPaying}
                  >
                    {isPaying ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </div>
                    ) : (
                      `Pay with ${paymentProvider === 'MOMO' ? 'MTN/Airtel' : 'Card'} (Flutterwave)`
                    )}
                  </Button>
                  
                  {txRef && (
                    <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                      Transaction Reference: {txRef}
                    </div>
                  )}
                  
                  {flutterwaveLink && (
                    <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200">
                      <p className="font-medium text-blue-700 mb-1">Payment Link Generated</p>
                      <p className="text-blue-600 mb-2">If the payment page didn't open automatically, click the link below:</p>
                      <a 
                        href={flutterwaveLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800 break-all"
                      >
                        {flutterwaveLink}
                      </a>
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
                      <div className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded border border-yellow-200">
                        <p className="font-medium text-yellow-700 mb-1">Payment Verification Required</p>
                        <p className="text-yellow-600">
                          After completing payment on Flutterwave, return here and click "Verify Payment" to confirm your booking.
                        </p>
                        <p className="text-xs mt-1 text-yellow-600">
                          💡 Tip: Keep this tab open while making payment in the other tab
                        </p>
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
                    <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-700">
                      <p className="font-medium">Next Steps:</p>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Click "Confirm and Continue" below to finalize your booking</li>
                        <li>Check your email for confirmation details</li>
                        <li>Your booking will be confirmed and dates reserved</li>
                      </ol>
                    </div>
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