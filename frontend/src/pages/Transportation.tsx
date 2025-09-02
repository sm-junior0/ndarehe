import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Plane, MapPin, Users, Clock, ArrowLeft, Check, Calendar, User } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import EmailVerificationReminder from "@/components/EmailVerificationReminder";
import { transportationApi, bookingsApi, paymentsApi, stripeApi } from "@/lib/api";

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

const getTransportationImage = (vehicle: Transportation) => {
  return vehicle.images[0] || "/placeholder.svg";
};


const Transportation = () => {
  const [transportation, setTransportation] = useState<Transportation[]>([]);
  const location = useLocation();
  const inDashboard = location.pathname.startsWith('/dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  // UI selection: VISA | MASTERCARD | MOMO. Maps to backend methods CARD or MOBILE_MONEY
  // Payment method is now handled by Stripe checkout
  const [selectedService, setSelectedService] = useState<Transportation | null>(null);
  const [booking, setBooking] = useState({
    startDate: "",
    endDate: "",
    passengers: "1",
    pickupLocation: "",
    dropoffLocation: "",
    serviceType: "trip" // kept for compatibility; pricing will be days-based
  });
  const [showVerificationReminder, setShowVerificationReminder] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [paymentVerified, setPaymentVerified] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [txRef, setTxRef] = useState<string | null>(null);

  // Fetch transportation from API
  const fetchTransportation = async () => {
    try {
      setLoading(true);
      setError("");

      const params: any = {};
      if (selectedType !== "all") params.type = selectedType;
      if (selectedVehicle !== "all") params.vehicleType = selectedVehicle;

      const response = await transportationApi.getAll(params);

      if (response.success) {
        setTransportation(response.data.transportation || []);
      } else {
        setError("Failed to fetch transportation services");
        toast({
          title: "Error",
          description: "Failed to load transportation services. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error fetching transportation:", err);
      setError(err.message || "Failed to fetch transportation services");
      toast({
        title: "Error",
        description: err.message || "Failed to load transportation services. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransportation();
  }, [selectedType, selectedVehicle]);

  // Filter transportation locally for additional filtering
  const filteredTransportation = transportation.filter(trans => {
    return true; // All filtering is done by API
  });

  const transportTypes = ["AIRPORT_PICKUP", "CITY_TRANSPORT", "TOUR_TRANSPORT", "PRIVATE_TRANSPORT"];
  const vehicleTypes = ["STANDARD", "VIP", "VAN", "BUS", "MOTORCYCLE"];

  const openBookingModal = (service: Transportation) => {
    setSelectedService(service);
    setBooking({
      startDate: "",
      endDate: "",
      passengers: "1",
      pickupLocation: "",
      dropoffLocation: "",
      serviceType: "trip"
    });
    setSuccess(false);
    setPaymentVerified(false);
    setTxRef(null);
    setPaymentLink(null);
    setModalOpen(true);
  };

  const handleBooking1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    // Basic date validation
    if (!booking.startDate || !booking.endDate) {
      toast({ title: 'Dates required', description: 'Please select start and end dates.', variant: 'destructive' });
      return;
    }
    if (new Date(booking.endDate) <= new Date(booking.startDate)) {
      toast({ title: 'Invalid Dates', description: 'End date must be after start date.', variant: 'destructive' });
      return;
    }

    // Check if user is verified
    if (user && !user.isVerified) {
      setShowVerificationReminder(true);
      return;
    }

    try {
      // For Stripe checkout, we don't need to validate card fields here
      // User will enter card details on Stripe's secure checkout page

      const response = await bookingsApi.create({
        serviceType: "TRANSPORTATION",
        serviceId: selectedService.id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        numberOfPeople: parseInt(booking.passengers),
        specialRequests: `Pickup: ${booking.pickupLocation}, Dropoff: ${booking.dropoffLocation}, Service Type: ${booking.serviceType}`
      });

      if (response.success) {
        const msPerDay = 1000 * 60 * 60 * 24;
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        const rawNights = Math.ceil((end.getTime() - start.getTime()) / msPerDay);
        const days = Math.max(1, rawNights);
        const baseAmount = days * (selectedService.pricePerTrip || 0);
        const stripeFee = baseAmount * 0.05; // 5% Stripe fee
        const amount = baseAmount + stripeFee;

        setIsPaying(true);

        // Prepare customer for hosted pay
        const customer = {
          email: user?.email || 'guest@example.com',
          name: `${user?.firstName || 'Guest'} ${user?.lastName || ''}`.trim(),
        } as { email: string; name: string };

        // Initialize Stripe Hosted Pay via backend
        const initRes = await stripeApi.init({
          bookingId: (response as any).data.booking.id,
          amount,
          currency: selectedService.currency || 'USD',
          customer,
        });

        if (initRes.success && initRes.link) {
          setPaymentLink(initRes.link);
          if (initRes.tx_ref) setTxRef(initRes.tx_ref);
          // Redirect same tab
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

  const handleBooking = async (e: React.FormEvent) => {
  e.preventDefault();
  toast({
    title: "Payment Feature Coming Soon",
    description: "The payment feature will be available in the near future.",
    variant: "default"
  });
};

  const verifyPayment1 = async () => {
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

  const verifyPayment = async () => {
  toast({
    title: "Payment Feature Coming Soon",
    description: "The payment feature will be available in the near future.",
    variant: "default"
  });
};

  if (loading) {
    const content = (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
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

  const main = (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          {!inDashboard && (
            <Button variant="ghost" size="sm" asChild className="hover:bg-green-50 hover:text-green-700 transition-all duration-300">
              <Link to="/explore">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Explore
              </Link>
            </Button>
          )}
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
            Transportation Services
          </h1>
          <p className="text-xl text-muted-foreground">Reliable transportation across Rwanda</p>
        </div>

        <div className="text-center mb-8 mt-8">
          <h2 className="text-2xl font-bold mb-2">Choose Your Vehicle</h2>
          <p className="text-muted-foreground">Select the perfect vehicle for your transportation</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
          <Button
            onClick={fetchTransportation}
            variant="outline"
            size="sm"
            className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
          >
            Try Again
          </Button>
        </div>
      )}


      {/* Transportation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTransportation.map((service) => (
          <Card key={service.id} className="group overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg">
            <div className="aspect-video bg-muted overflow-hidden">
              <img
                src={getTransportationImage(service)}
                alt={service.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <Badge variant={service.vehicleType === 'VIP' ? 'default' : 'secondary'}>
                  {service.vehicleType}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {service.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{service.location.city}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Up to {service.capacity}</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex gap-2 text-sm">
                  <span className="font-semibold">Per Trip:</span>
                  <span className="font-medium">
                    {(service.pricePerTrip || 0).toLocaleString()} {service.currency}
                  </span>
                </div>
                {service.pricePerHour && (
                  <div className="flex gap-2 text-sm">
                    <span className="font-semibold">Per Hour:</span>
                    <span className="font-medium">
                      {service.pricePerHour.toLocaleString()} {service.currency}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-1">
                  {service.amenities.slice(0, 3).map((amenity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
                <Button onClick={() => openBookingModal(service)}>
                  Book Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTransportation.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {error ? "Failed to load transportation services." : "No transportation services found matching your criteria."}
          </p>
          <Button
            onClick={fetchTransportation}
            className="mt-4"
          >
            {error ? "Try Again" : "Clear Filters"}
          </Button>
        </div>
      )}

      {/* Booking Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/30">
          {selectedService && !success && (
            <form onSubmit={handleBooking} className="space-y-4">
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <img
                    src={selectedService.images[0] || "/placeholder.svg"}
                    alt={selectedService.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div>
                    <DialogTitle>{selectedService.name}</DialogTitle>
                    <DialogDescription>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {selectedService.location.city} • {selectedService.vehicleType}
                      </div>
                      <div className="flex items-center mt-1">
                        <Users className="h-4 w-4 mr-1" />
                        Up to {selectedService.capacity} passengers
                      </div>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={booking.startDate}
                    onChange={e => setBooking({ ...booking, startDate: e.target.value })}
                    className="focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={booking.endDate}
                    onChange={e => setBooking({ ...booking, endDate: e.target.value })}
                    className="focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pickupLocation">Pickup Location</Label>
                  <Input
                    id="pickupLocation"
                    placeholder="Enter pickup address"
                    value={booking.pickupLocation}
                    onChange={e => setBooking({ ...booking, pickupLocation: e.target.value })}
                    className="focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dropoffLocation">Dropoff Location</Label>
                  <Input
                    id="dropoffLocation"
                    placeholder="Enter dropoff address"
                    value={booking.dropoffLocation}
                    onChange={e => setBooking({ ...booking, dropoffLocation: e.target.value })}
                    className="focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="passengers">Number of Passengers</Label>
                  <Input
                    id="passengers"
                    type="number"
                    min="1"
                    max={selectedService.capacity}
                    value={booking.passengers}
                    onChange={e => setBooking({ ...booking, passengers: e.target.value })}
                    className="focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Select
                    value={booking.serviceType}
                    onValueChange={(value) => setBooking({ ...booking, serviceType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trip">Per Trip</SelectItem>
                      <SelectItem value="hour">Per Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payment section (same form) */}
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

              {/* Live total */}
              {selectedService && (() => {
                const hasDates = booking.startDate && booking.endDate;
                const msPerDay = 1000 * 60 * 60 * 24;
                const raw = hasDates ? Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / msPerDay) : 0;
                const days = hasDates ? Math.max(1, raw) : 0;
                const baseTotal = days > 0 ? days * (selectedService.pricePerTrip || 0) : 0;
                const stripeFee = baseTotal * 0.05;
                const total = baseTotal + stripeFee;
                return (
                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {days > 0 ? `Total for ${days} day${days > 1 ? 's' : ''}` : 'Total'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Base rate: {selectedService.currency} {(selectedService.pricePerTrip || 0).toLocaleString()} per trip
                          {days > 0 && (
                            <>
                              <br />
                              Base: {selectedService.currency} {baseTotal.toLocaleString()}
                              <br />
                              Stripe fee (5%): {selectedService.currency} {stripeFee.toLocaleString()}
                            </>
                          )}
                        </p>
                      </div>
                      <p className="text-xl font-bold">
                        {days > 0 ? `${selectedService.currency} ${total.toLocaleString()}` : 'Select dates'}
                        {days > 0 && <span className="text-sm block text-muted-foreground">Includes 5% fee</span>}
                      </p>
                    </div>
                  </div>
                );
              })()}

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
                      disabled={true}
                      onClick={verifyPayment}
                      // disabled={isPaying || paymentVerified}
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
                  setSuccess(true);
                  // Redirect to dashboard after successful payment
                  setTimeout(() => {
                    window.location.href = "/dashboard/transportation";
                  }, 2000);
                }}
              >
                {paymentVerified ? 'Confirm and Continue' : 'Complete Payment First'}
              </Button>
            </form>
          )}
          {selectedService && success && (
            <div className="text-center space-y-6 py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
              <div className="space-y-2">
                <p>Your <span className="font-semibold">{selectedService.name}</span> booking is confirmed.</p>
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
  );

  return inDashboard ? main : (
    <div className="min-h-screen bg-background">
      <Header />
      {main}
      <Footer />
    </div>
  );
};

export default Transportation; 