import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Hotel, Car, MapPin, HelpCircle, Star, Users, Shield, Clock, BarChart3, User, Shield as ShieldIcon } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const features = [
    {
      icon: Hotel,
      title: "Book a Hotel or House",
      description: "Find perfect accommodations from hotels to homestays across Rwanda",
              href: "/accommodations",
      color: "bg-green-50 text-green-600"
    },
    {
      icon: Car,
      title: "Plan My Airport Pickup",
      description: "Reliable transportation from Kigali International Airport",
      href: "/airport-pickup",
      color: "bg-green-50 text-green-600"
    },
    {
      icon: MapPin,
      title: "Explore City Tours & Nightlife",
      description: "Discover Rwanda's culture, history, and vibrant nightlife",
      href: "/local-experiences",
      color: "bg-purple-50 text-purple-600"
    },
    {
      icon: HelpCircle,
      title: "Need Help Planning?",
      description: "Get personalized recommendations from local experts",
      href: "/trip-planner",
      color: "bg-orange-50 text-orange-600"
    }
  ];

  const stats = [
    { icon: Star, label: "Verified Accommodations", value: "500+" },
    { icon: Users, label: "Happy Travelers", value: "10,000+" },
    { icon: Shield, label: "Secure Bookings", value: "100%" },
    { icon: Clock, label: "24/7 Support", value: "Always" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600/90 to-green-800/90 text-white">
        <div className="absolute inset-0 bg-[url('/src/rwanda_main.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/80 to-green-800/80"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-white/20 rounded-full animate-ping"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/15 rounded-full animate-bounce"></div>
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-32 z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight animate-fade-in">
              Discover Rwanda's
              <span className="block bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent animate-pulse">
                Hidden Gems
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto animate-fade-in-delay">
              Your gateway to authentic Rwandan accommodation and unforgettable local experiences
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-2">
              <Button asChild size="lg" className="bg-white text-green-700 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold">
                <Link to="/explore">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* User Dashboard Quick Access */}
      <UserDashboardAccess />

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              Why choose NDAREHE?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience Rwanda like never before with our comprehensive travel services
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg overflow-hidden">
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color.replace('50', '100')} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <CardContent className="p-6 text-center space-y-4 relative z-10">
                    <div className={`inline-flex p-4 rounded-full ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to explore Rwanda?</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join thousands of travelers who have discovered the beauty of Rwanda through NDAREHE
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/explore">Explore Services</Link>
            </Button>
            <Button asChild size="lg" className="bg-white/20 text-white border-white/30 hover:bg-white/30 hover:border-white/50 transition-all duration-300 backdrop-blur-sm">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

// User Dashboard Access Component
const UserDashboardAccess = () => {
  const { user } = useAuth();

  if (!user) {
    return null; // Don't show if user is not logged in
  }

  const getDashboardInfo = () => {
    switch (user.role) {
      case 'ADMIN':
        return {
          title: 'Admin Dashboard',
          description: 'Manage the entire platform',
          icon: BarChart3,
          href: '/admin',
          color: 'bg-red-600 hover:bg-red-700'
        };
      case 'PROVIDER':
        return {
          title: 'Provider Dashboard',
          description: 'Manage your services and bookings',
          icon: ShieldIcon,
          href: '/provider-dashboard',
          color: 'bg-purple-600 hover:bg-purple-700'
        };
      case 'USER':
      default:
        return {
          title: 'User Dashboard',
          description: 'View your bookings and profile',
          icon: User,
          href: '/dashboard',
          color: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const dashboardInfo = getDashboardInfo();

  return (
    <section className="py-8 bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white rounded-full shadow-md">
                    <dashboardInfo.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Welcome back, {user.firstName}!
                    </h3>
                    <p className="text-gray-600">
                      {dashboardInfo.description}
                    </p>
                  </div>
                </div>
                <Button asChild className={dashboardInfo.color}>
                  <Link to={dashboardInfo.href}>
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Index;
