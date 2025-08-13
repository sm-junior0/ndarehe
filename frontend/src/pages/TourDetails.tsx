import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Star, Clock, Users, ArrowLeft, Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { toursApi, bookingsApi, paymentsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import EmailVerificationReminder from "@/components/EmailVerificationReminder";

interface Tour {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  location: {
    id: string;
    name: string;
    city: string;
    district: string;
    province: string;
  };
  duration: number;
  maxParticipants: number;
  minParticipants: number;
  pricePerPerson: number;
  currency: string;
  isAvailable: boolean;
  images: string[];
  itinerary: string[];
  includes: string[];
  excludes: string[];
  meetingPoint: string;
  startTime: string;
  endTime: string;
  rating: number;
  totalReviews: number;
  averageRating: number;
}

const TourDetails = () => {
  const { id } = useParams();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  // UI selection: VISA | MASTERCARD | MOMO. Maps to backend methods CARD or MOBILE_MONEY
  const [paymentProvider, setPaymentProvider] = useState<'VISA' | 'MASTERCARD' | 'MOMO'>('VISA');
  const [selectedBank, setSelectedBank] = useState<'Bank of Kigali' | "I&M Bank" | 'Equity Bank'>('Bank of Kigali');
  const [card, setCard] = useState({ holder: "", number: "", expiry: "", cvc: "" });
  const [momo, setMomo] = useState({
    phone: "",
    name: "",
    reference: "",
  });
  const [booking, setBooking] = useState({
    date: "",
    participants: "2",
    specialRequests: ""
  });
  const [showVerificationReminder, setShowVerificationReminder] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch tour details from API
  const fetchTour = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError("");
      
      const response = await toursApi.getById(id);
      
      if (response.success) {
        setTour(response.data.tour);
      } else {
        setError("Failed to fetch tour details");
        toast({
          title: "Error",
          description: "Failed to load tour details. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error fetching tour:", err);
      setError(err.message || "Failed to fetch tour details");
      toast({
        title: "Error",
        description: err.message || "Failed to load tour details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTour();
  }, [id]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tour) return;
    
    // Check if user is verified
    if (user && !user.isVerified) {
      setShowVerificationReminder(true);
      return;
    }
    
    try {
      const response = await bookingsApi.create({
        serviceType: "TOUR",
        serviceId: tour.id,
        startDate: booking.date,
        endDate: booking.date,
        numberOfPeople: parseInt(booking.participants),
        specialRequests: booking.specialRequests
      });

      if (response.success) {
        // Compute total and pay immediately
        const amount = tour.pricePerPerson * parseInt(booking.participants);
        
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
          bookingId: (response as any).data.booking.id,
          amount,
          method: paymentProvider === 'MOMO' ? 'MOBILE_MONEY' : 'CARD',
          currency: tour.currency || 'RWF',
        });

        if ((payRes as any).success) {
          setSuccess(true);
          toast({ title: 'Payment successful', description: 'Your booking has been confirmed.' });
        } else {
          throw new Error('Payment failed');
        }
      } else {
        throw new Error(response.message || "Booking failed");
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      
      // Check if error is due to email verification
      if (error.message && error.message.includes("verify your email")) {
        setShowVerificationReminder(true);
      } else {
        toast({
          title: "Booking Failed",
          description: error.message || "There was an error processing your booking. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

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

  if (error || !tour) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Tour Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || "The tour you're looking for doesn't exist."}
            </p>
            <Button asChild>
              <Link to="/tours">Back to Tours</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="hover:bg-green-50 hover:text-green-700 transition-all duration-300">
            <Link to="/tours">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tours
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold mb-4">{tour.name}</h1>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{tour.location.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-muted-foreground">{tour.averageRating || 0} ({tour.totalReviews || 0} reviews)</span>
              </div>
              <Badge variant="outline">{tour.category}</Badge>
            </div>
            
            <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-6">
              <img 
                src={tour.images[0]} 
                alt={tour.name} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>About this tour</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{tour.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{tour.duration} hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{tour.minParticipants}-{tour.maxParticipants} people</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{tour.meetingPoint}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Itinerary</h4>
                    <ul className="space-y-1">
                      {tour.itinerary.map((item, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">What's Included</h4>
                    <ul className="space-y-1">
                      {tour.includes.map((item, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Book this tour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold">RWF {tour.pricePerPerson.toLocaleString()}</div>
                  <div className="text-muted-foreground">per person</div>
                </div>
                
                <Button className="w-full" size="lg" onClick={() => setModalOpen(true)}>
                  Book Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Booking Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/30">
            {!success && (
              <form onSubmit={handleBooking} className="space-y-4">
                <DialogHeader>
                  <div className="flex items-start gap-4">
                    <img 
                      src={tour.images[0]} 
                      alt={tour.name} 
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div>
                      <DialogTitle>{tour.name}</DialogTitle>
                      <DialogDescription>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {tour.location.name} • {tour.duration} hours
                        </div>
                        <div className="flex items-center mt-1">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          {tour.averageRating || 0} • RWF {tour.pricePerPerson.toLocaleString()}/person
                        </div>
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Tour Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={booking.date} 
                      onChange={e => setBooking({ ...booking, date: e.target.value })} 
                      className="focus-visible:ring-0 focus-visible:ring-offset-0"
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="participants">Number of Participants</Label>
                    <Input 
                      id="participants" 
                      type="number" 
                      min={tour.minParticipants}
                      max={tour.maxParticipants}
                      value={booking.participants} 
                      onChange={e => setBooking({ ...booking, participants: e.target.value })} 
                      className="focus-visible:ring-0 focus-visible:ring-offset-0"
                      required 
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                  <Input 
                    id="specialRequests" 
                    placeholder="Any special requirements or requests..." 
                    value={booking.specialRequests} 
                    onChange={e => setBooking({ ...booking, specialRequests: e.target.value })} 
                    className="focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                
                {/* Payment section (same form) */}
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
                </div>

                {paymentProvider !== 'MOMO' && (
                  <div className="grid grid-cols-1 gap-4">
                    {paymentProvider === 'VISA' && (
                      <div>
                        <Label htmlFor="issuingBank">Issuing Bank</Label>
                        <select id="issuingBank" className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={selectedBank} onChange={(e) => setSelectedBank(e.target.value as any)}>
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

                {/* Live total */}
                {(() => {
                  const participants = parseInt(booking.participants || '0') || 0;
                  const total = participants * (tour.pricePerPerson || 0);
                  return (
                    <div className="bg-secondary/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Total for {participants} participant{participants>1?'s':''}</p>
                          <p className="text-sm text-muted-foreground">Rate: {tour.currency} {tour.pricePerPerson.toLocaleString()} per person. Includes all taxes and fees.</p>
                        </div>
                        <p className="text-xl font-bold">{tour.currency} {total.toLocaleString()}</p>
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
                  <p>Your <span className="font-semibold">{tour.name}</span> booking is confirmed.</p>
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
        
        {/* Email Verification Reminder */}
        <EmailVerificationReminder 
          isOpen={showVerificationReminder}
          onClose={() => setShowVerificationReminder(false)}
        />
      </main>

      <Footer />
    </div>
  );
};

export default TourDetails; 