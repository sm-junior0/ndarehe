import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Users, Star, Calendar, ChevronDown, ChevronUp, Check, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Type definitions
interface Experience {
  id: number;
  title: string;
  category: string;
  description: string;
  duration: string;
  price: number;
  rating: number;
  groupSize: string;
  image: string;
  highlights: string[];
  meetingPoint: string;
  includes: string[];
  requirements: string[];
}

interface BookingDetails {
  date: string;
  participants: number;
  specialRequests: string;
}

interface Category {
  value: string;
  label: string;
}

const LocalExperiences = () => {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    date: "",
    participants: 1,
    specialRequests: ""
  });
  const [confirmed, setConfirmed] = useState(false);
  const { toast } = useToast();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [experiencesLoading, setExperiencesLoading] = useState(true);

  // Fetch experiences from backend
  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    setExperiencesLoading(true);
    try {
      const response = await fetch("/api/tours");
      if (response.ok) {
        const data = await response.json();
        setExperiences(data.data.tours);
      } else {
        // Fallback to mock data if API fails
        console.log("Using fallback experiences data");
      }
    } catch (error) {
      console.error("Error fetching experiences:", error);
      // Keep using mock data as fallback
    } finally {
      setExperiencesLoading(false);
    }
  };

  const categories: Category[] = [
    { value: "all", label: "All Experiences" },
    { value: "Cultural", label: "Cultural" },
    { value: "Wildlife", label: "Wildlife" },
    { value: "Art", label: "Art" }
  ];

  const filteredExperiences = experiences.filter(exp => {
    const matchesCategory = filter === "all" || exp.category === filter;
    const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         exp.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openModal = (experience: Experience) => {
    setSelectedExperience(experience);
    setBookingDetails({
      date: "",
      participants: 1,
      specialRequests: ""
    });
    setConfirmed(false);
    setModalOpen(true);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExperience) return;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to book this experience",
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
          serviceType: "TOUR",
          serviceId: selectedExperience.id.toString(),
          startDate: bookingDetails.date,
          numberOfPeople: bookingDetails.participants,
          specialRequests: bookingDetails.specialRequests
        }),
      });

      if (response.ok) {
        setConfirmed(true);
        toast({
          title: "Booking Confirmed!",
          description: `Your ${selectedExperience.title} experience is confirmed.`
        });
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

  const clearFilters = () => {
    setFilter("all");
    setSearchQuery("");
  };

  const Label = ({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium mb-1">
      {children}
    </label>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Authentic Rwandan Experiences</h1>
          <p className="text-muted-foreground">Immerse yourself in Rwanda's rich culture and breathtaking nature</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="search">Search experiences</Label>
            <Input
              id="search"
              placeholder="Search experiences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div>
            <Label htmlFor="category">Filter by category</Label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Experience Grid */}
        {experiencesLoading ? (
          <div className="text-center py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading experiences...</span>
            </div>
          </div>
        ) : filteredExperiences.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No experiences match your search criteria</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredExperiences.map((experience) => (
              <Card key={experience.id} className="overflow-hidden hover:shadow-md transition-all">
                <div className="relative">
                  <img
                    src={experience.image}
                    alt={experience.title}
                    className="w-full h-48 object-cover"
                  />
                  <Badge className="absolute top-2 left-2">{experience.category}</Badge>
                  <div className="absolute bottom-2 right-2 bg-background/90 px-2 py-1 rounded flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="font-medium">{experience.rating}</span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{experience.title}</h3>
                  
                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    {experience.meetingPoint}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">{experience.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{experience.duration}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{experience.groupSize}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-sm mb-2">Highlights</h4>
                    <div className="flex flex-wrap gap-2">
                      {experience.highlights.slice(0, 3).map((highlight) => (
                        <Badge key={highlight} variant="secondary" className="flex items-center gap-1">
                          <Check className="h-3 w-3" /> {highlight}
                        </Badge>
                      ))}
                      {experience.highlights.length > 3 && (
                        <Badge variant="secondary">+{experience.highlights.length - 3} more</Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardFooter className="flex items-center justify-between p-0">
                    <div>
                                              <span className="text-xl font-bold">RWF {experience.price.toLocaleString()}</span>
                      <span className="text-muted-foreground text-sm"> /person</span>
                    </div>
                    <Button onClick={() => openModal(experience)}>Book Now</Button>
                  </CardFooter>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedExperience && !confirmed && (
            <form onSubmit={handleBooking} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Book {selectedExperience.title}</DialogTitle>
                <DialogDescription>
                  <div className="flex items-center mt-1">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                            {selectedExperience.rating} • {selectedExperience.duration} • RWF {selectedExperience.price.toLocaleString()}/person
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <div>
                <Label htmlFor="date">Experience Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={bookingDetails.date}
                  onChange={(e) => setBookingDetails({...bookingDetails, date: e.target.value})}
                  className="focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="participants">Number of Participants</Label>
                <Input
                  id="participants"
                  type="number"
                  min="1"
                  max="12"
                  value={bookingDetails.participants}
                  onChange={(e) => setBookingDetails({...bookingDetails, participants: Number(e.target.value)})}
                  className="focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                <Input
                  id="specialRequests"
                  value={bookingDetails.specialRequests}
                  onChange={(e) => setBookingDetails({...bookingDetails, specialRequests: e.target.value})}
                  className="focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Dietary restrictions, accessibility needs, etc."
                />
              </div>
              
              <div className="bg-secondary/50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Total for {bookingDetails.participants} {bookingDetails.participants === 1 ? 'person' : 'people'}</p>
                    <p className="text-sm text-muted-foreground">Includes all fees and taxes</p>
                  </div>
                  <p className="text-xl font-bold">
                                            RWF {(selectedExperience.price * bookingDetails.participants).toLocaleString()}
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
          
          {selectedExperience && confirmed && (
            <div className="text-center space-y-6 py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600">Booking Confirmed!</h2>
              <div className="space-y-2">
                <p>Your <span className="font-semibold">{selectedExperience.title}</span> experience is confirmed.</p>
                <p className="text-muted-foreground">Check your email for details and meeting instructions.</p>
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

      <Footer />
    </div>
  );
};

export default LocalExperiences;