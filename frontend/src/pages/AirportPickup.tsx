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
import { transportationApi, bookingsApi, stripeApi } from "@/lib/api";

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

const getAirportPickupImage = (vehicle: Transportation) => {
  return vehicle.images[1] || vehicle.images[0] || "/placeholder.svg";
};

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
  // Payment method is now handled by Stripe checkout
  const [showVerificationReminder, setShowVerificationReminder] = useState(false);

  // Added for payment flow
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [txRef, setTxRef] = useState<string | null>(null);

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
    // Reset payment states
    setPaymentVerified(false);
    setTxRef(null);
    setPaymentLink(null);
    setConfirmed(false);
    // Payment form states are no longer needed
    setModalOpen(true);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar) return;


    if (user && !user.isVerified) {
      setShowVerificationReminder(true);
      return;
    }

    try {
      // For Stripe checkout, we don't need to validate card fields here
      // User will enter card details on Stripe's secure checkout page

      const response = await bookingsApi.create({
        serviceType: "TRANSPORTATION",
        serviceId: selectedCar.id,
        startDate: booking.date + "T" + booking.time,
        endDate: booking.date + "T" + booking.time,
        numberOfPeople: booking.passengers,
        specialRequests: `Airport Pickup - Flight: ${booking.flightNumber}, Airline: ${booking.airline}, Destination: ${booking.destination}`
      });

      if (response.success) {
        const baseAmount = selectedCar.pricePerTrip;
        const stripeFee = baseAmount * 0.05; // 5% Stripe fee
        const amount = baseAmount + stripeFee;

        setIsPaying(true);

        const customer = {
          email: user?.email || 'guest@example.com',
          name: `${user?.firstName || 'Guest'} ${user?.lastName || ''}`.trim(),
        } as { email: string; name: string };

        const initRes = await stripeApi.init({
          bookingId: (response as any).data.booking.id,
          amount,
          currency: selectedCar.currency || 'RWF',
          customer,
        });

        if (initRes.success && initRes.link) {
          setPaymentLink(initRes.link);
          if (initRes.tx_ref) setTxRef(initRes.tx_ref);
          window.location.href = initRes.link;
        } else {
          throw new Error(initRes.message || 'Failed to initiate payment');
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
      const data = await stripeApi.verifyJson(txRef);
      if (data.success && data.paid) {
        setPaymentVerified(true);
        toast({ title: 'Payment Verified', description: 'Your payment has been confirmed. You can now proceed.', variant: 'default' });
      } else {
        throw new Error('Payment not verified yet. Please complete the payment and try again.');
      }
    } catch (error: any) {
      toast({ title: 'Verification Failed', description: error.message || 'Payment not verified', variant: 'destructive' });
    } finally {
      setIsPaying(false);
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
    <div className="min-h-screen flex flex-col">
      {showLayout && <Header />}

      <div className="flex-1 w-full px-4 py-8 bg-gradient-to-b from-gray-50 to-white">
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
        <div className="w-full max-w-7xl mx-auto">
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
                    className="group overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg cursor-pointer h-full flex flex-col"
                    onClick={() => openModal(vehicle)}
                  >
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img
                        src={getAirportPickupImage(vehicle)}
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
                    <CardContent className="pt-0 flex-1 flex flex-col justify-end">
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <img src="/logos/visa.svg" alt="Visa" className="h-4" />
                      <img src="/logos/mastercard.svg" alt="Mastercard" className="h-4" />
                      <img src="/logos/momo.jpg" alt="MTN MoMo" className="h-4" />
                      <span>Secure checkout via Stripe</span>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Total</p>
                      <p className="text-sm text-muted-foreground">
                        Base: {selectedCar.currency} {selectedCar.pricePerTrip.toLocaleString()}
                        <br />
                        Stripe fee (5%): {selectedCar.currency} {(selectedCar.pricePerTrip * 0.05).toLocaleString()}
                        <br />
                        Includes all taxes and fees
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {selectedCar.currency} {(selectedCar.pricePerTrip * 1.05).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Includes 5% fee</p>
                    </div>
                  </div>
                </div>

                 {/* Payment Actions */}
                 <div className="space-y-4">
                  {/* Step 1: Initiate Payment */}
                  <div className="space-y-2">
                    <Button type="submit" className="w-full" disabled={isPaying}>
                      {isPaying ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </div>
                      ) : (
                        'Pay with Card (Stripe)'
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
                      {!paymentVerified && (
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
                  type="button" 
                  className="w-full" 
                  disabled={!paymentVerified}
                  variant={paymentVerified ? "default" : "secondary"}
                  onClick={() => {
                    setConfirmed(true);
                    // Redirect to dashboard after successful payment
                    setTimeout(() => {
                      window.location.href = "/dashboard/airportpickup";
                    }, 2000);
                  }}
                >
                  {paymentVerified ? 'Confirm and Continue' : 'Complete Payment First'}
                </Button>
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