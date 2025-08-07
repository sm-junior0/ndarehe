import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Car, Users, Shield, Check, Luggage, Loader2, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const AirportPickup = () => {
  const [tripType, setTripType] = useState("one-way");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [booking, setBooking] = useState({
    tripType: "one-way",
    flightNumber: "",
    airline: "",
    destination: "",
    date: "",
    time: "",
    passengers: 1
  });
  const [confirmed, setConfirmed] = useState(false);
  const { toast } = useToast();
  const [transportationLoading, setTransportationLoading] = useState(true);
  const [vehicles, setVehicles] = useState([
    {
      id: "standard",
      name: "Standard Car",
      description: "Comfortable sedan for up to 3 passengers",
      capacity: 3,
      luggage: 2,
      price: 25,
      image: "https://images.unsplash.com/photo-1549924231-f129b911e442?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      features: ["Air Conditioning", "GPS Navigation", "Phone Charger"],
      icon: <Car className="w-5 h-5 text-primary" />
    },
    {
      id: "vip",
      name: "VIP Luxury",
      description: "Premium vehicle with enhanced comfort",
      capacity: 3,
      luggage: 3,
      price: 50,
      image: "https://images.unsplash.com/photo-1563720223185-11003d516935?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      features: ["Leather Seats", "Wi-Fi", "Complimentary Water", "Premium Sound"],
      icon: <Shield className="w-5 h-5 text-primary" />
    },
    {
      id: "van",
      name: "Family Van",
      description: "Spacious van for large groups and families",
      capacity: 8,
      luggage: 6,
      price: 40,
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      features: ["Extra Space", "Multiple USB Ports", "Child Seats Available"],
      icon: <Users className="w-5 h-5 text-primary" />
    }
  ]);

  // Fetch transportation services from backend
  useEffect(() => {
    fetchTransportationServices();
  }, []);

  const fetchTransportationServices = async () => {
    setTransportationLoading(true);
    try {
      const response = await fetch("/api/transportation?type=AIRPORT_PICKUP");
      if (response.ok) {
        const data = await response.json();
        setVehicles(data.data.transportation);
      } else {
        // Keep using mock data as fallback
        console.log("Using fallback transportation data");
      }
    } catch (error) {
      console.error("Error fetching transportation:", error);
      // Keep using mock data as fallback
    } finally {
      setTransportationLoading(false);
    }
  };

  const openModal = (car: any) => {
    setSelectedCar(car);
    setBooking({ ...booking, tripType, flightNumber: "", airline: "", destination: "", date: "", time: "", passengers: 1 });
    setConfirmed(false);
    setModalOpen(true);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar) return;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to book this service",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceType: "TRANSPORTATION",
          serviceId: selectedCar.id.toString(),
          startDate: booking.date + "T" + booking.time,
          numberOfPeople: booking.passengers,
          specialRequests: `Flight: ${booking.flightNumber}, Airline: ${booking.airline}, Destination: ${booking.destination}`
        }),
      });

      if (response.ok) {
        setConfirmed(true);
        toast({ title: "Airport Pickup Confirmed!", description: `Your ${selectedCar.name} is booked.` });
      } else {
        throw new Error("Booking failed");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
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
              {vehicles.map((car) => (
                <Card 
                  key={car.id} 
                  className="group overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg cursor-pointer"
                  onClick={() => openModal(car)}
                >
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img 
                      src={car.image} 
                      alt={car.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg">{car.name}</CardTitle>
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        RWF {car.price.toLocaleString()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {car.description}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{car.capacity} passengers</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Luggage className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{car.luggage} luggage</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {car.features.slice(0, 3).map((f: string) => (
                        <Badge key={f} variant="outline" className="text-xs">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Booking Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            {selectedCar && !confirmed && (
              <form onSubmit={handleBooking} className="space-y-4">
                <DialogHeader>
                  <div className="flex items-start gap-4">
                    <img 
                      src={selectedCar.image} 
                      alt={selectedCar.name} 
                      className="w-24 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <DialogTitle>Book {selectedCar.name}</DialogTitle>
                      <DialogDescription>
                        RWF {selectedCar.price.toLocaleString()} • {selectedCar.capacity} passengers • {selectedCar.luggage} luggage
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
                  <Label htmlFor="modal-destination">Destination</Label>
                  <Input 
                    id="modal-destination" 
                    value={booking.destination} 
                    onChange={e => setBooking({ ...booking, destination: e.target.value })} 
                    className="focus-visible:ring-0 focus-visible:ring-offset-0"
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="modal-date">Date</Label>
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
                    <Label htmlFor="modal-time">Time</Label>
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
                
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Total</p>
                      <p className="text-sm text-muted-foreground">Includes all taxes and fees</p>
                    </div>
                    <p className="text-xl font-bold">RWF {selectedCar.price.toLocaleString()}</p>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit" className="w-full">
                    Confirm Booking
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
                  <p>Your <span className="font-semibold">{selectedCar.name}</span> is booked.</p>
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
      </div>

      <Footer />
    </div>
  );
};

export default AirportPickup;