import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Star, Clock, Users, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toursApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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

const Tours = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const location = useLocation();
  const inDashboard = location.pathname.startsWith('/dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();

  // Fetch tours from API
  const fetchTours = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedType !== "all") params.type = selectedType;
      if (selectedCategory !== "all") params.category = selectedCategory;
      
      const response = await toursApi.getAll(params);
      
      if (response.success) {
        setTours(response.data.tours || []);
      } else {
        setError("Failed to fetch tours");
        toast({
          title: "Error",
          description: "Failed to load tours. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error fetching tours:", err);
      setError(err.message || "Failed to fetch tours");
      toast({
        title: "Error",
        description: err.message || "Failed to load tours. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, [searchTerm, selectedType, selectedCategory]);

  // Filter tours locally for additional filtering
  const filteredTours = tours.filter(tour => {
    return true; // All filtering is done by API
  });

  const tourTypes = ["CITY_TOUR", "CULTURAL_TOUR", "ADVENTURE_TOUR", "FOOD_TOUR", "NATURE_TOUR"];
  const categories = ["BUDGET", "STANDARD", "PREMIUM", "LUXURY"];

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
              Tours & Experiences
            </h1>
            <p className="text-xl text-muted-foreground">Discover amazing tours and local experiences in Rwanda</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <Button 
              onClick={fetchTours}
              variant="outline" 
              size="sm" 
              className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-gradient-to-r from-green-50 to-white border border-green-200 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-green-600" />
              <Input
                placeholder="Search tours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-green-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="border-green-200 focus:border-green-500 focus:ring-green-500">
                <SelectValue placeholder="Tour Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {tourTypes.map(type => (
                  <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="border-green-200 focus:border-green-500 focus:ring-green-500">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={() => {
                setSearchTerm("");
                setSelectedType("all");
                setSelectedCategory("all");
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
            Found {filteredTours.length} tour{filteredTours.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Tours Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTours.map((tour) => (
            <Card key={tour.id} className="group overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg">
              <div className="aspect-video bg-muted overflow-hidden">
                <img
                  src={tour.images[0] || "/placeholder.svg"}
                  alt={tour.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{tour.name}</CardTitle>
                  <Badge variant={tour.category === 'LUXURY' ? 'default' : 'secondary'}>
                    {tour.category}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {tour.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{tour.averageRating || 0}</span>
                    <span className="text-sm text-muted-foreground">({tour.totalReviews || 0})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{tour.location.city}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{tour.duration} hours</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{tour.minParticipants}-{tour.maxParticipants} people</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-2xl font-bold">
                      RWF {tour.pricePerPerson.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground"> / person</span>
                  </div>
                  <Button asChild>
                    <Link to={`/tour/${tour.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTours.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {error ? "Failed to load tours." : "No tours found matching your criteria."}
            </p>
            <Button 
              onClick={fetchTours}
              className="mt-4"
            >
              {error ? "Try Again" : "Clear Filters"}
            </Button>
          </div>
        )}
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

export default Tours; 