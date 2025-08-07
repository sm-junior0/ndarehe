import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { transportationApi, bookingsApi } from "@/lib/api";

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

const Transportation = () => {
  const [transportation, setTransportation] = useState<Transportation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedService, setSelectedService] = useState<Transportation | null>(null);
  const [booking, setBooking] = useState({
    date: "",
    time: "",
    passengers: "1",
    pickupLocation: "",
    dropoffLocation: "",
    serviceType: "trip" // "trip" or "hour"
  });
  const [showVerificationReminder, setShowVerificationReminder] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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
      date: "",
      time: "",
      passengers: "1",
      pickupLocation: "",
      dropoffLocation: "",
      serviceType: "trip"
    });
    setConfirmed(false);
    setModalOpen(true);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    
    // Check if user is verified
    if (user && !user.isVerified) {
      setShowVerificationReminder(true);
      return;
    }
    
    try {
      const response = await bookingsApi.create({
        serviceType: "TRANSPORTATION",
        serviceId: selectedService.id,
        startDate: booking.date,
        endDate: booking.date, // Same day for transportation
        numberOfPeople: parseInt(booking.passengers),
        specialRequests: `Pickup: ${booking.pickupLocation}, Dropoff: ${booking.dropoffLocation}, Time: ${booking.time}, Service Type: ${booking.serviceType}`
      });

      if (response.success) {
        setConfirmed(true);
        toast({ 
          title: "Booking Confirmed!", 
          description: `Your ${selectedService.name} booking is confirmed.` 
        });
      } else {
        throw new Error("Booking failed");
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
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-gray-200 rounded"></div>
              ))}
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
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild className="hover:bg-green-50 hover:text-green-700 transition-all duration-300">
              <Link to="/explore">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Explore
              </Link>
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              Transportation Services
            </h1>
            <p className="text-xl text-muted-foreground">Reliable transportation across Rwanda</p>
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

        {/* Filters */}
        <div className="bg-gradient-to-r from-green-50 to-white border border-green-200 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="border-green-200 focus:border-green-500 focus:ring-green-500">
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {transportTypes.map(type => (
                  <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger className="border-green-200 focus:border-green-500 focus:ring-green-500">
                <SelectValue placeholder="Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {vehicleTypes.map(vehicle => (
                  <SelectItem key={vehicle} value={vehicle}>{vehicle}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={() => {
                setSelectedType("all");
                setSelectedVehicle("all");
              }}
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Found {filteredTransportation.length} service{filteredTransportation.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Transportation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTransportation.map((service) => (
            <Card key={service.id} className="group overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg">
              <div className="aspect-video bg-muted overflow-hidden">
                <img
                  src={service.images[0] || "/placeholder.svg"}
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
                  <div className="flex justify-between text-sm">
                    <span>Per Trip:</span>
                    <span className="font-medium">
                      {service.pricePerTrip.toLocaleString()} {service.currency}
                    </span>
                  </div>
                  {service.pricePerHour && (
                    <div className="flex justify-between text-sm">
                      <span>Per Hour:</span>
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
          <DialogContent className="sm:max-w-[600px]">
            {selectedService && !confirmed && (
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
                    <Label htmlFor="date">Date</Label>
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
                    <Label htmlFor="time">Time</Label>
                    <Input 
                      id="time" 
                      type="time" 
                      value={booking.time} 
                      onChange={e => setBooking({ ...booking, time: e.target.value })} 
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
                
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Total for {selectedService.vehicleType}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.serviceType === "trip" ? "Per trip" : "Per hour"}
                      </p>
                    </div>
                    <p className="text-xl font-bold">
                      {booking.serviceType === "trip" 
                                        ? `RWF ${selectedService.pricePerTrip.toLocaleString()}`
                : `RWF ${selectedService.pricePerHour?.toLocaleString() || 0}`
                      }
                    </p>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit" className="w-full">
                    Confirm Booking
                  </Button>
                </DialogFooter>
              </form>
            )}
            
            {selectedService && confirmed && (
              <div className="text-center space-y-6 py-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-600">Booking Confirmed!</h2>
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

      <Footer />
    </div>
  );
};

export default Transportation; 