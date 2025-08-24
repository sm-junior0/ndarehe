import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Car, Users, Shield, Check, Luggage, Loader2, ArrowLeft, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import EmailVerificationReminder from "@/components/EmailVerificationReminder";
import { transportationApi, bookingsApi, paymentsApi } from "@/lib/api";

interface Transportation {
  id: string;
  name: string;
  description: string;
  type: string;
  vehicleType: string;
  location: {
    id: string;
    name: string;
    city: string;
    district: string;
    province: string;
  };
  capacity: number;
  pricePerTrip: number;
  pricePerHour?: number;
  currency: string;
  isAvailable: boolean;
  images: string[];
  amenities: string[];
}

const AirportPickup = ({ showLayout = true }: { showLayout?: boolean }) => {
  const location = useLocation();
  const inDashboard = location.pathname.startsWith('/dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Transportation | null>(null);
  const [booking, setBooking] = useState({
    flightNumber: "",
    airline: "",
    destination: "",
    date: "",
    time: "",
    passengers: 1
  });
  const [confirmed, setConfirmed] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [transportationLoading, setTransportationLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Transportation[]>([]);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<'VISA' | 'MASTERCARD' | 'MOMO'>('VISA');
  const [selectedBank, setSelectedBank] = useState<'Bank of Kigali' | "I&M Bank" | 'Equity Bank'>('Bank of Kigali');
  const [card, setCard] = useState({ holder: "", number: "", expiry: "", cvc: "" });
  const [momo, setMomo] = useState({
    phone: "",
    name: "",
    reference: "",
  });
  const [showVerificationReminder, setShowVerificationReminder] = useState(false);

  // Fetch transportation services from backend
  useEffect(() => {
    fetchTransportationServices();
  }, []);

  const fetchTransportationServices = async () => {
    setTransportationLoading(true);
    try {
      const response = await transportationApi.getAll();
      
      if (response.success) {
        // Filter for vehicles suitable for airport pickup
        const airportVehicles = response.data.transportation.filter(
          (vehicle: Transportation) => vehicle.isAvailable
        );
        setVehicles(airportVehicles);
      } else {
        throw new Error("Failed to fetch transportation data");
      }
    } catch (error) {
      console.error("Error fetching transportation:", error);
      toast({
        title: "Error",
        description: "Failed to load transportation options. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTransportationLoading(false);
    }
  };

  const openModal = (car: Transportation) => {
    setSelectedCar(car);
    setBooking({ 
      flightNumber: "", 
      airline: "", 
      destination: "", 
      date: "", 
      time: "", 
      passengers: 1 
    });
    setConfirmed(false);
    setModalOpen(true);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar) return;
    
    // Check if user is verified
    if (user && !user.isVerified) {
      setShowVerificationReminder(true);
      return;
    }
    
    try {
      const response = await bookingsApi.create({
        serviceType: "TRANSPORTATION",
        serviceId: selectedCar.id,
        startDate: booking.date + "T" + booking.time,
        endDate: booking.date + "T" + booking.time,
        numberOfPeople: booking.passengers,
        specialRequests: `Airport Pickup - Flight: ${booking.flightNumber}, Airline: ${booking.airline}, Destination: ${booking.destination}`
      });

      if (response.success) {
        const amount = selectedCar.pricePerTrip;
        
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
          currency: selectedCar.currency || 'USD',
        });

        if ((payRes as any).success) {
          setConfirmed(true);
          toast({ 
            title: "Airport Pickup Confirmed!", 
            description: `Your ${selectedCar.name} is booked for airport pickup.` 
          });
        } else {
          throw new Error('Payment failed');
        }
      } else {
        throw new Error("Booking failed");
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      
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

  // Helper function to get luggage capacity based on vehicle type
  const getLuggageCapacity = (vehicleType: string, capacity: number) => {
    switch (vehicleType) {
      case "VAN":
        return Math.floor(capacity * 1.5);
      case "BUS":
        return capacity * 2;
      case "VIP":
        return Math.floor(capacity * 0.8);
      default:
        return Math.floor(capacity * 0.7);
    }
  };

  return (
    <div className="min-h-screen">
      {showLayout && <Header />}
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {showLayout && (
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" asChild className="hover:bg-green-50 hover:text-green-700 transition-all duration-300">
                <Link to="/explore">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Explore
                </Link>
              </Button>
            </div>
          )}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              Airport Pickup Service
            </h1>
            <p className="text-xl text-muted-foreground">Reliable transportation from Kigali International Airport</p>
          </div>
        </div>

        {/* Vehicle Selection */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Choose Your Vehicle</h2>
            <p className="text-muted-foreground">Select the perfect vehicle for your airport transfer</p>
          </div>
          
          {transportationLoading ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading vehicles...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => {
                const luggageCapacity = getLuggageCapacity(vehicle.vehicleType, vehicle.capacity);
                
                return (
                  <Card 
                    key={vehicle.id} 
                    className="group overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg cursor-pointer"
                    onClick={() => openModal(vehicle)}
                  >
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img 
                        src={vehicle.images[0] || "/placeholder.svg"} 
                        alt={vehicle.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                          {vehicle.currency} {vehicle.pricePerTrip.toLocaleString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {vehicle.description}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{vehicle.location.city}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{vehicle.capacity} passengers</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Luggage className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{luggageCapacity} luggage</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {vehicle.amenities.slice(0, 3).map((amenity: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {vehicle.amenities.length === 0 && (
                          <Badge variant="outline" className="text-xs">
                            {vehicle.vehicleType} Service
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {vehicles.length === 0 && !transportationLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No airport pickup vehicles available at the moment.
              </p>
              <Button 
                onClick={fetchTransportationServices}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Booking Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            {selectedCar && !confirmed && (
              <form onSubmit={handleBooking} className="space-y-4">
                <DialogHeader>
                  <div className="flex items-start gap-4">
                    <img 
                      src={selectedCar.images[0] || "/placeholder.svg"} 
                      alt={selectedCar.name} 
                      className="w-24 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <DialogTitle>Book {selectedCar.name}</DialogTitle>
                      <DialogDescription>
                        {selectedCar.currency} {selectedCar.pricePerTrip.toLocaleString()} • {selectedCar.capacity} passengers
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="modal-flight-number">Flight Number</Label>
                    <Input 
                      id="modal-flight-number" 
                      value={booking.flightNumber} 
                      onChange={e => setBooking({ ...booking, flightNumber: e.target.value })} 
                      className="focus-visible:ring-0 focus-visible:ring-offset-0"
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="modal-airline">Airline</Label>
                    <Input 
                      id="modal-airline" 
                      value={booking.airline} 
                      onChange={e => setBooking({ ...booking, airline: e.target.value })} 
                      className="focus-visible:ring-0 focus-visible:ring-offset-0"
                      required 
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="modal-destination">Destination Address</Label>
                  <Input 
                    id="modal-destination" 
                    placeholder="Enter your destination address" 
                    value={booking.destination} 
                    onChange={e => setBooking({ ...booking, destination: e.target.value })} 
                    className="focus-visible:ring-0 focus-visible:ring-offset-0"
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="modal-date">Pickup Date</Label>
                    <Input 
                      id="modal-date" 
                      type="date" 
                      value={booking.date} 
                      onChange={e => setBooking({ ...booking, date: e.target.value })} 
                      className="focus-visible:ring-0 focus-visible:ring-offset-0"
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="modal-time">Pickup Time</Label>
                    <Input 
                      id="modal-time" 
                      type="time" 
                      value={booking.time} 
                      onChange={e => setBooking({ ...booking, time: e.target.value })} 
                      className="focus-visible:ring-0 focus-visible:ring-offset-0"
                      required 
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="modal-passengers">Passengers</Label>
                  <Input 
                    id="modal-passengers" 
                    type="number" 
                    min="1" 
                    max={selectedCar.capacity} 
                    value={booking.passengers} 
                    onChange={e => setBooking({ ...booking, passengers: Number(e.target.value) })} 
                    className="focus-visible:ring-0 focus-visible:ring-offset-0"
                    required 
                  />
                  <p className="text-xs text-muted-foreground mt-1">Max capacity: {selectedCar.capacity} passengers</p>
                </div>
                
                {/* Payment Method Selection */}
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
                
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Total</p>
                      <p className="text-sm text-muted-foreground">Includes all taxes and fees</p>
                    </div>
                    <p className="text-xl font-bold">{selectedCar.currency} {selectedCar.pricePerTrip.toLocaleString()}</p>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit" className="w-full" disabled={isPaying}>
                    {isPaying ? 'Processing...' : 'Confirm Booking'}
                  </Button>
                </DialogFooter>
              </form>
            )}
            
            {selectedCar && confirmed && (
              <div className="text-center space-y-6 py-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-600">Booking Confirmed!</h2>
                <div className="space-y-2">
                  <p>Your <span className="font-semibold">{selectedCar.name}</span> is booked for airport pickup.</p>
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
      </div>

      {showLayout && <Footer />}
    </div>
  );
};

export default AirportPickup;