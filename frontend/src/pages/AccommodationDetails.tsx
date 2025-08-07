import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Star, Users, ArrowLeft, Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { bookingsApi, accommodationsApi } from "@/lib/api";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [booking, setBooking] = useState({
    checkIn: "",
    checkOut: "",
    guests: "1",
    specialRequests: ""
  });
  const [showVerificationReminder, setShowVerificationReminder] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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
      } catch (error: any) {
        console.error("Error fetching accommodation:", error);
        setError(error.message || "Failed to load accommodation details");
      } finally {
        setLoading(false);
      }
    };

    fetchAccommodation();
  }, [id]);

  const handleBooking = async (e: React.FormEvent) => {
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
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to book this accommodation",
          variant: "destructive"
        });
        return;
      }

      const response = await bookingsApi.create({
        serviceType: "ACCOMMODATION",
        serviceId: accommodation.id,
        startDate: booking.checkIn,
        endDate: booking.checkOut,
        numberOfPeople: parseInt(booking.guests),
        specialRequests: booking.specialRequests || ""
      });

      if (response.success) {
        setConfirmed(true);
        toast({
          title: "Booking Confirmed!",
          description: `Your stay at ${accommodation.name} is confirmed.`
        });
      } else {
        throw new Error("Booking failed");
      }
    } catch (error: any) {
      console.error("Booking error:", error);

      let errorMessage = error.message || "There was an error processing your booking. Please try again.";

      // If your API errors have a 'status' property, check for it generically
      if (error && typeof error === "object" && "status" in error) {
        if ((error as any).status === 400) {
          errorMessage = "Please check your booking details and try again.";
        } else if ((error as any).status === 401) {
          errorMessage = "Please log in to complete your booking.";
        }
      }

      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive"
      });
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

  if (error || !accommodation) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Accommodation Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || "The accommodation you're looking for doesn't exist."}
            </p>
            <Button asChild>
              <Link to="/accommodations">Back to Accommodations</Link>
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
          <Button variant="ghost" size="sm" asChild>
            <Link to="/accommodations">
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

            {/* Accommodation Images */}
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
              </CardContent>
            </Card>

            {/* Reviews Section */}
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
                  <div className="text-3xl font-bold">RWF {accommodation.pricePerNight.toLocaleString()}</div>
                  <div className="text-muted-foreground">per night</div>
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
          <DialogContent className="sm:max-w-[600px]">
            {!confirmed && (
              <form onSubmit={handleBooking} className="space-y-4">
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
                          {accommodation.averageRating} • RWF {accommodation.pricePerNight.toLocaleString()}/night
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
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Total for {accommodation.type}</p>
                      <p className="text-sm text-muted-foreground">Includes all taxes and fees</p>
                    </div>
                    <p className="text-xl font-bold">RWF {accommodation.pricePerNight.toLocaleString()}</p>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" className="w-full">
                    Confirm Booking
                  </Button>
                </DialogFooter>
              </form>
            )}

            {confirmed && (
              <div className="text-center space-y-6 py-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-600">Booking Confirmed!</h2>
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

export default AccommodationDetails; 