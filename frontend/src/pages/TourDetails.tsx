import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const inDashboard = location.pathname.startsWith('/dashboard');
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
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
        const amount = tour.pricePerPerson * parseInt(booking.participants);
        
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

  const renderExperienceCard = () => {
    if (!tour) return null;

    const experienceCards: Record<string, JSX.Element> = {
      "Gorilla Trekking Experience": (
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Gorilla Trekking Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold">USD {tour.pricePerPerson.toLocaleString()}</div>
              <div className="text-muted-foreground">per person</div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">About This Adventure</h4>
              <p className="text-sm text-muted-foreground">
                Encounter Rwanda's majestic mountain gorillas in their natural habitat. This life-changing experience 
                takes you through Volcanoes National Park with intimate encounters with endangered mountain gorillas.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Experience Highlights</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Face-to-face with mountain gorillas</li>
                <li>• Guided trek through rainforest</li>
                <li>• Professional trackers and guides</li>
                <li>• Certificate of participation</li>
                <li>• Breathtaking volcanic landscapes</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Key Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Duration: {tour.duration}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>Group: {tour.minParticipants}-{tour.maxParticipants}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⭐</span>
                  <span>Difficulty: Challenging</span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <span>📅</span>
                  <span>Best time: Dry season (June-September)</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Meeting Point</h4>
              <p className="text-sm text-muted-foreground">{tour.meetingPoint}</p>
            </div>

           
          </CardContent>
        </Card>
      ),
      "Rwanda Birding Experience": (
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Birding Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold">USD {tour.pricePerPerson.toLocaleString()}</div>
              <div className="text-muted-foreground">per person</div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">About This Experience</h4>
              <p className="text-sm text-muted-foreground">
                Discover Rwanda's rich avian diversity with 703 species, including 29 Albertine Rift Endemics. 
                Experience the best montane birding in Africa with expert guides.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Birding Highlights</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 29 Albertine Rift Endemic species</li>
                <li>• Red-collared Babbler sightings</li>
                <li>• Professional birding guides</li>
                <li>• Diverse habitats exploration</li>
                <li>• Photography opportunities</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Key Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Duration: {tour.duration}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>Group: {tour.minParticipants}-{tour.maxParticipants}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⭐</span>
                  <span>Difficulty: Moderate</span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <span>📅</span>
                  <span>Best time: Year-round</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Meeting Point</h4>
              <p className="text-sm text-muted-foreground">{tour.meetingPoint}</p>
            </div>

            
          </CardContent>
        </Card>
      ),
      "Kigali City Tour": (
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Kigali City Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold">USD {tour.pricePerPerson.toLocaleString()}</div>
              <div className="text-muted-foreground">per person</div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">About This Tour</h4>
              <p className="text-sm text-muted-foreground">
                Discover Africa's cleanest city! Explore Kigali's vibrant culture, history, and modern African spirit 
                with comprehensive city exploration and local insights.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Tour Highlights</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Kigali Genocide Memorial visit</li>
                <li>• Local markets exploration</li>
                <li>• Art centers and craft shops</li>
                <li>• City viewpoint photography</li>
                <li>• Cultural experiences</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Key Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Duration: {tour.duration}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>Group: {tour.minParticipants}-{tour.maxParticipants}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⭐</span>
                  <span>Difficulty: Easy</span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <span>📅</span>
                  <span>Best time: Year-round</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Meeting Point</h4>
              <p className="text-sm text-muted-foreground">{tour.meetingPoint}</p>
            </div>

          </CardContent>
        </Card>
      ),
      "Rwandan Cultural Experience": (
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Cultural Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold">USD {tour.pricePerPerson.toLocaleString()}</div>
              <div className="text-muted-foreground">per person</div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">About This Experience</h4>
              <p className="text-sm text-muted-foreground">
                Immerse yourself in Rwanda's living traditions through music, dance, and daily life with local communities. 
                Discover the rich cultural heritage of the Land of a Thousand Hills.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Cultural Highlights</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Traditional dance performances</li>
                <li>• Craft demonstrations</li>
                <li>• Local cuisine cooking lessons</li>
                <li>• Community storytelling</li>
                <li>• Traditional welcome ceremonies</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Key Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Duration: {tour.duration}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>Group: {tour.minParticipants}-{tour.maxParticipants}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⭐</span>
                  <span>Difficulty: Easy</span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <span>📅</span>
                  <span>Best time: Year-round</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Meeting Point</h4>
              <p className="text-sm text-muted-foreground">{tour.meetingPoint}</p>
            </div>

            
          </CardContent>
        </Card>
      ),
      "Kings Palace Museum Tour": (
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>King's Palace Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold">USD {tour.pricePerPerson.toLocaleString()}</div>
              <div className="text-muted-foreground">per person</div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">About This Tour</h4>
              <p className="text-sm text-muted-foreground">
                Step back in time at Rwanda's historic Kings Palace with traditional architecture, cultural performances, 
                and the famous long-horned Inyambo cattle.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Tour Highlights</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Traditional royal palace tour</li>
                <li>• Long-horned Inyambo cattle</li>
                <li>• Cultural performances</li>
                <li>• Historical artifacts</li>
                <li>• Storytelling sessions</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Key Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Duration: {tour.duration}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>Group: {tour.minParticipants}-{tour.maxParticipants}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⭐</span>
                  <span>Difficulty: Easy</span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <span>📅</span>
                  <span>Best time: Year-round</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Meeting Point</h4>
              <p className="text-sm text-muted-foreground">{tour.meetingPoint}</p>
            </div>

          </CardContent>
        </Card>
      ),
      "Musanze Caves Exploration": (
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Caves Exploration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold">USD {tour.pricePerPerson.toLocaleString()}</div>
              <div className="text-muted-foreground">per person</div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">About This Adventure</h4>
              <p className="text-sm text-muted-foreground">
                Explore ancient lava caves and Rwanda's volcanic landscapes with guided tours through fascinating 
                lava tunnels formed over 65 million years ago.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Exploration Highlights</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Lava tunnel exploration</li>
                <li>• Geological formations</li>
                <li>• Safety equipment provided</li>
                <li>• Professional cave guides</li>
                <li>• Volcanic landscape views</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Key Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Duration: {tour.duration}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>Group: {tour.minParticipants}-{tour.maxParticipants}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⭐</span>
                  <span>Difficulty: Moderate</span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <span>📅</span>
                  <span>Best time: Dry season</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Meeting Point</h4>
              <p className="text-sm text-muted-foreground">{tour.meetingPoint}</p>
            </div>

          </CardContent>
        </Card>
      ),
      "Lake Kivu Experience": (
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Lake Kivu Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold">USD {tour.pricePerPerson.toLocaleString()}</div>
              <div className="text-muted-foreground">per person</div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">About This Experience</h4>
              <p className="text-sm text-muted-foreground">
                Experience the serene beauty of Rwanda's sparkling Lake Kivu with boat trips, island exploration, 
                and water activities on Africa's sixth largest lake.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Lake Highlights</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Boat tours to islands</li>
                <li>• Freshwater swimming</li>
                <li>• Beach relaxation</li>
                <li>• Lakeside dining</li>
                <li>• Scenic photography</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Key Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Duration: {tour.duration}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>Group: {tour.minParticipants}-{tour.maxParticipants}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⭐</span>
                  <span>Difficulty: Easy</span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <span>📅</span>
                  <span>Best time: Year-round</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Meeting Point</h4>
              <p className="text-sm text-muted-foreground">{tour.meetingPoint}</p>
            </div>

          </CardContent>
        </Card>
      ),
      "Akagera Wildlife Safari": (
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Wildlife Safari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold">USD {tour.pricePerPerson.toLocaleString()}</div>
              <div className="text-muted-foreground">per person</div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">About This Safari</h4>
              <p className="text-sm text-muted-foreground">
                Discover Rwanda's wild side with unforgettable Akagera adventures including game drives and boat safaris 
                in a diverse landscape of savannah, woodland, and wetlands.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Safari Highlights</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Big Five game viewing</li>
                <li>• Boat trips on Lake Ihema</li>
                <li>• 490 bird species</li>
                <li>• Professional safari guides</li>
                <li>• Diverse ecosystems</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Key Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Duration: {tour.duration}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>Group: {tour.minParticipants}-{tour.maxParticipants}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⭐</span>
                  <span>Difficulty: Easy</span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <span>📅</span>
                  <span>Best time: Dry season</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Meeting Point</h4>
              <p className="text-sm text-muted-foreground">{tour.meetingPoint}</p>
            </div>
          </CardContent>
        </Card>
      ),
      "Nyungwe National Park Adventure": (
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Nyungwe Adventure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold">USD {tour.pricePerPerson.toLocaleString()}</div>
              <div className="text-muted-foreground">per person</div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">About This Adventure</h4>
              <p className="text-sm text-muted-foreground">
                Explore one of Africa's oldest rainforests with chimpanzee trekking, canopy walks, and breathtaking 
                waterfalls in this biodiversity-rich national park.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Park Highlights</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Chimpanzee trekking</li>
                <li>• Canopy walk adventure</li>
                <li>• Waterfall hikes</li>
                <li>• 13 primate species</li>
                <li>• 300+ bird species</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Key Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Duration: {tour.duration}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>Group: {tour.minParticipants}-{tour.maxParticipants}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⭐</span>
                  <span>Difficulty: Moderate</span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <span>📅</span>
                  <span>Best time: Dry season</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Meeting Point</h4>
              <p className="text-sm text-muted-foreground">{tour.meetingPoint}</p>
            </div>
          </CardContent>
        </Card>
      )
    };

    return experienceCards[tour.name] || (
      <Card className="sticky top-24">
        <CardHeader>
          <CardTitle>Book This Experience</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className="text-3xl font-bold">RWF {tour.pricePerPerson.toLocaleString()}</div>
            <div className="text-muted-foreground">per person</div>
          </div>
        </CardContent>
      </Card>
    );
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

  if (error || !tour) {
    const content = (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tour Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "The tour you're looking for doesn't exist."}
          </p>
          <Button asChild>
            <Link to={inDashboard ? "/dashboard/tours" : "/tours"}>
              Back to Tours
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
        <Button variant="ghost" size="sm" asChild className="hover:bg-green-50 hover:text-green-700 transition-all duration-300">
          <Link to={inDashboard ? "/dashboard/tours" : "/tours"}>
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
              <CardTitle>About this experience</CardTitle>
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
          {renderExperienceCard()}
        </div>
      </div>
      
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

export default TourDetails;