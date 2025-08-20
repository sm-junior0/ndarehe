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
import { bookingsApi, accommodationsApi, paymentsApi } from "@/lib/api";
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
  // New optional fields to support richer hotel info without breaking existing data
  contactNumbers?: string[]; // alternative to single phone
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
  // UI selection: VISA | MASTERCARD | MOMO. Maps to backend methods CARD or MOBILE_MONEY
  const [paymentProvider, setPaymentProvider] = useState<'VISA' | 'MASTERCARD' | 'MOMO'>('VISA');
  const [selectedBank, setSelectedBank] = useState<'Bank of Kigali' | "I&M Bank" | 'Equity Bank'>('Bank of Kigali');
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

  // Derived booking values
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

  const handleBookingAndPayment = async (e: React.FormEvent) => {
    e.preventDefault();


    console.log("Special requests before sending:", booking.specialRequests);


    if (!accommodation) return;


    if (new Date(booking.checkOut) <= new Date(booking.checkIn)) {
      toast({
        title: "Invalid Dates",
        description: "Check-out date must be after check-in date",
        variant: "destructive"
      });
      return;
    }

    // Check if user is verified
    console.log('User verification status:', user?.isVerified);
    if (user && !user.isVerified) {
      console.log('User not verified, showing reminder');
      setShowVerificationReminder(true);
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to book this accommodation",
          variant: "destructive"
        });
        return;
      }

      // Create booking first
      const response = await bookingsApi.create({
        serviceType: "ACCOMMODATION",
        serviceId: accommodation.id,
        startDate: booking.checkIn,
        endDate: booking.checkOut,
        numberOfPeople: parseInt(booking.guests),
        specialRequests: booking.specialRequests || ""
      });

      if (response.success) {
        // Compute total and pay immediately (per person per night)
        const checkInDate = new Date(booking.checkIn);
        const checkOutDate = new Date(booking.checkOut);
        const msPerDay = 1000 * 60 * 60 * 24;
        const rawNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / msPerDay);
        const nights = Math.max(1, rawNights);
        const guests = parseInt(booking.guests) || 1;
        const amount = nights * guests * accommodation.pricePerNight;

        // Validate payment fields
        if (paymentProvider === 'MOMO') {
          if (!momo.phone || !momo.name) {
            throw new Error('Please provide your MoMo number and name.');
          }
        } else {
          if (!card.holder || !card.number || !card.expiry || !card.cvc) {
            throw new Error('Please fill in all card fields.');
          }
        }

        setIsPaying(true);
        const payRes = await paymentsApi.createSingle({
          bookingId: response.data.booking.id,
          amount,
          method: paymentProvider === 'MOMO' ? 'MOBILE_MONEY' : 'CARD',
          currency: accommodation.currency || 'RWF',
        });

        if (payRes.success) {
          setSuccess(true);
          toast({ title: 'Payment successful', description: 'Your booking has been confirmed.' });
        } else {
          throw new Error('Payment failed');
        }
      } else {
        throw new Error("Booking failed");
      }
    } catch (error: unknown) {
      console.error("Booking error:", error);

      let errorMessage = "There was an error processing your booking. Please try again.";

      // Handle different error types
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === "object" && "status" in error) {
        const statusError = error as { status: number };
        if (statusError.status === 400) {
          errorMessage = "Please check your booking details and try again.";
        } else if (statusError.status === 401) {
          errorMessage = "Please log in to complete your booking.";
        }
      }

      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive"
      });
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
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/30">
          {!success && (
            <form onSubmit={handleBookingAndPayment} className="space-y-4">
              <DialogHeader>
                <div className="flex items-start gap-4">
                  {accommodation.images && accommodation.images.length > 0 && (
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
                        {accommodation.averageRating} • {accommodation.currency} {accommodation.pricePerNight.toLocaleString()}/night per person
                      </div>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

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

              <div>
                <Label htmlFor="guests">Number of Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max={accommodation.maxGuests}
                  value={booking.guests}
                  onChange={e => setBooking({ ...booking, guests: e.target.value })}
                  className="focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
              </div>

              <div className="mb-4">
                <Label htmlFor="specialRequests">Special Requests</Label>
                <textarea
                  id="specialRequests"
                  value={booking.specialRequests}
                  onChange={(e) => setBooking({ ...booking, specialRequests: e.target.value })}
                  className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Any special requirements..."
                />
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Payment Method</h4>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setPaymentProvider('VISA')} className={`rounded border p-1 transition ${paymentProvider==='VISA' ? 'ring-2 ring-green-600' : 'border-input'}`} aria-label="Pay with Visa">
                    <img src="/logos/visa.svg" alt="Visa" className="h-6" />
                  </button>
                  <button type="button" onClick={() => setPaymentProvider('MASTERCARD')} className={`rounded border p-1 transition ${paymentProvider==='MASTERCARD' ? 'ring-2 ring-green-600' : 'border-input'}`} aria-label="Pay with Mastercard">
                    <img src="/logos/mastercard.svg" alt="Mastercard" className="h-6" />
                  </button>
                  <button type="button" onClick={() => setPaymentProvider('MOMO')} className={`rounded border p-1 transition ${paymentProvider==='MOMO' ? 'ring-2 ring-green-600' : 'border-input'}`} aria-label="Pay with MTN MoMo">
                    <img src="/logos/momo.svg" alt="MTN MoMo" className="h-6" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Unit price: {accommodation.currency} {accommodation.pricePerNight.toLocaleString()} per person per night
                </p>
              </div>

              {paymentProvider !== 'MOMO' && (
                <div className="grid grid-cols-1 gap-4">
                  {paymentProvider === 'VISA' && (
                    <div>
                      <Label htmlFor="issuingBank">Issuing Bank</Label>
                      <select id="issuingBank" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={selectedBank} onChange={(e) => setSelectedBank(e.target.value as 'Bank of Kigali' | "I&M Bank" | 'Equity Bank')}>
                        <option>Bank of Kigali</option>
                        <option>I&M Bank</option>
                        <option>Equity Bank</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="cardHolder">Cardholder Name</Label>
                    <Input id="cardHolder" placeholder="JOHN DOE" value={card.holder} onChange={e => setCard({ ...card, holder: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input id="cardNumber" inputMode="numeric" maxLength={19} placeholder="4111 1111 1111 1111" value={card.number} onChange={e => setCard({ ...card, number: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                      <Input id="expiry" placeholder="12/26" value={card.expiry} onChange={e => setCard({ ...card, expiry: e.target.value })} required />
                    </div>
                    <div>
                      <Label htmlFor="cvc">Security Code</Label>
                      <Input id="cvc" placeholder="123" maxLength={4} value={card.cvc} onChange={e => setCard({ ...card, cvc: e.target.value })} required />
                    </div>
                  </div>
                </div>
              )}

              {paymentProvider === 'MOMO' && (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="momoName">MoMo Account Name</Label>
                    <Input id="momoName" placeholder="JOHN DOE" value={momo.name} onChange={e => setMomo({ ...momo, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="momoPhone">MoMo Phone Number</Label>
                    <Input id="momoPhone" placeholder="07xx xxx xxx" inputMode="tel" value={momo.phone} onChange={e => setMomo({ ...momo, phone: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="momoRef">Payment Reference (optional)</Label>
                    <Input id="momoRef" placeholder="eg. TRIP-2025-0001" value={momo.reference} onChange={e => setMomo({ ...momo, reference: e.target.value })} />
                  </div>
                </div>
              )}

              {(() => {
                const hasDates = booking.checkIn && booking.checkOut;
                let nights = 0;
                if (hasDates) {
                  const ci = new Date(booking.checkIn).getTime();
                  const co = new Date(booking.checkOut).getTime();
                  nights = Math.max(1, Math.ceil((co - ci) / (1000*60*60*24)));
                }
                const guests = parseInt(booking.guests || '1') || 1;
                const total = (nights || 0) * guests * (accommodation.pricePerNight || 0);
                
                return (
                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {nights > 0 
                            ? `Total for ${guests} guest${guests>1?'s':''} over ${nights} night${nights>1?'s':''}`
                            : `Total for ${guests} guest${guests>1?'s':''}`
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {nights > 0 
                            ? `Rate: ${accommodation.currency} ${accommodation.pricePerNight.toLocaleString()} per person per night. Includes all taxes and fees.`
                            : `Rate: ${accommodation.currency} ${accommodation.pricePerNight.toLocaleString()} per person per night. Select dates to see total.`
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        {nights > 0 ? (
                          <p className="text-xl font-bold">{accommodation.currency} {total.toLocaleString()}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Select dates</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <DialogFooter>
                <Button type="submit" className="w-full" disabled={isPaying}>
                  {isPaying ? 'Processing...' : 'Confirm and Pay'}
                </Button>
              </DialogFooter>
            </form>
          )}

          {success && (
            <div className="text-center space-y-6 py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
              <div className="space-y-2">
                <p>Your stay at <span className="font-semibold">{accommodation.name}</span> is confirmed.</p>
                <p className="text-muted-foreground">Check your email for confirmation details.</p>
              </div>
              <div className="pt-4">
                <Button className="w-full" onClick={() => setModalOpen(false)}>
                  Close
                </Button>
              </div>
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
