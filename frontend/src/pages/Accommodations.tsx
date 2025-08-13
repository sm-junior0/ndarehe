import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Users, Calendar, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { accommodationsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Accommodation {
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
  pricePerNight: number;
  currency: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  rating: number;
  totalReviews: number;
}

const Accommodations = () => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const location = useLocation();
  const inDashboard = location.pathname.startsWith('/dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const { toast } = useToast();

  // Fetch accommodations from API
  const fetchAccommodations = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedType !== "all") params.type = selectedType;
      if (selectedLocation !== "all") params.location = selectedLocation;
      
      const response = await accommodationsApi.getAll(params);
      
      if (response.success) {
        setAccommodations(response.data.accommodations || []);
      } else {
        setError("Failed to fetch accommodations");
        toast({
          title: "Error",
          description: "Failed to load accommodations. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error fetching accommodations:", err);
      setError(err.message || "Failed to fetch accommodations");
      toast({
        title: "Error",
        description: err.message || "Failed to load accommodations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccommodations();
  }, [searchTerm, selectedType, selectedLocation]);

  // Filter accommodations locally for category (since API might not support it)
  const filteredAccommodations = accommodations.filter(acc => {
    const matchesCategory = selectedCategory === "all" || acc.category === selectedCategory;
    return matchesCategory;
  });

  const accommodationTypes = ["HOTEL", "GUESTHOUSE", "APARTMENT", "VILLA", "HOSTEL", "CAMPING", "HOMESTAY"];
  const categories = ["BUDGET", "STANDARD", "PREMIUM", "LUXURY"];
  const locations = ["Nyarutarama", "Gacuriro", "Gishushu", "Gisozi","Kimihurura"];

  if (loading) {
    const content = (
      <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              Find Your Perfect Stay
            </h1>
            <p className="text-xl text-muted-foreground">Discover amazing accommodations across Rwanda</p>
          </div>
          <LoadingSpinner />
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
              Find Your Perfect Stay
            </h1>
            <p className="text-xl text-muted-foreground">Discover amazing accommodations across Rwanda</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gradient-to-r from-green-50 to-white border border-green-200 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-green-600" />
              <Input
                placeholder="Search accommodations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-green-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="border-green-200 focus:border-green-500">
                <SelectValue placeholder="Accommodation Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {accommodationTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="border-green-200 focus:border-green-500">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="border-green-200 focus:border-green-500">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={() => {
                setSearchTerm("");
                setSelectedType("all");
                setSelectedCategory("all");
                setSelectedLocation("all");
                // The useEffect will automatically refetch with cleared filters
              }}
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <Button 
              onClick={fetchAccommodations}
              variant="outline" 
              size="sm" 
              className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Results */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Found {filteredAccommodations.length} accommodation{filteredAccommodations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Accommodations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAccommodations.map((accommodation) => (
            <Card key={accommodation.id} className="group overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg">
              <div className="aspect-video bg-muted">
                <img
                  src={accommodation.images[0] || "/placeholder.svg"}
                  alt={accommodation.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{accommodation.name}</CardTitle>
                  <Badge variant={accommodation.category === 'LUXURY' ? 'default' : 'secondary'}>
                    {accommodation.category}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {accommodation.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{accommodation.rating}</span>
                    <span className="text-sm text-muted-foreground">({accommodation.totalReviews})</span>
                  </div>
                                     <div className="flex items-center gap-1">
                     <MapPin className="h-4 w-4 text-muted-foreground" />
                     <span className="text-sm text-muted-foreground">{accommodation.location.city}</span>
                   </div>
                </div>
                
                <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Up to {accommodation.maxGuests} guests</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{accommodation.bedrooms} bed{accommodation.bedrooms !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{accommodation.bathrooms} bath{accommodation.bathrooms !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-2xl font-bold">
                      {accommodation.currency} {accommodation.pricePerNight.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground"> / night</span>
                  </div>
                  <Button asChild>
                    <Link to={`/accommodation/${accommodation.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAccommodations.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {error ? "Failed to load accommodations." : "No accommodations found matching your criteria."}
            </p>
            <Button 
              onClick={fetchAccommodations}
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

export default Accommodations; 