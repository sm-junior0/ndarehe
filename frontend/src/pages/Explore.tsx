import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hotel, Car, Plane, BookOpen, MapPin, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";

const Explore = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  const navigate = useNavigate();

  const services = [
    {
      id: 1,
      title: "Accommodations",
      description: "Find the perfect place to stay in Rwanda",
      href: "/accommodations",
      color: "bg-green-50 text-green-600"
    },
    {
      id: "transportation",
      title: "Transportation",
      description: "Reliable transportation services throughout Rwanda",
      icon: Car,
      href: "/transportation",
      color: "bg-green-50 text-green-600"
    },
    {
      id: "airport-pickup",
      title: "Airport Pickup",
      description: "Seamless airport transfers and pickup services",
      icon: Plane,
      href: "/airport-pickup",
      color: "bg-purple-50 text-purple-600"
    },
    {
      id: "experiences",
      title: "Local Experiences",
      description: "Authentic tours and cultural experiences",
      icon: MapPin,
      href: "/tours",
      color: "bg-orange-50 text-orange-600"
    },
    {
      id: "blog",
      title: "Travel Blog",
      description: "Discover Rwanda through our travel stories and tips",
      icon: BookOpen,
      href: "/blog",
      color: "bg-red-50 text-red-600"
    }
  ];

  const sidebarItems = [
    { id: "overview", name: "Overview", icon: MapPin },
    { id: "accommodations", name: "Accommodations", icon: Hotel },
    { id: "transportation", name: "Transportation", icon: Car },
    { id: "airport-pickup", name: "Airport Pickup", icon: Plane },
    { id: "experiences", name: "Experiences", icon: MapPin },
    { id: "blog", name: "Blog", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-gradient-to-b from-white to-green-50 border border-green-200 rounded-2xl p-6 sticky top-24 shadow-lg">
              <h3 className="font-bold text-xl mb-6 text-green-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Services
              </h3>
              <nav className="space-y-3">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === "overview") {
                        setActiveTab(item.id);
                      } else {
                        // Check if user is authenticated
                        if (user) {
                          // Direct navigation to service pages
                          navigate(services.find(s => s.id === item.id)?.href || "/");
                        } else {
                          // Redirect to login page with redirect parameter
                          navigate(`/login?redirect=${encodeURIComponent(services.find(s => s.id === item.id)?.href || "/")}`);
                        }
                      }
                    }}
                                         className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                       activeTab === item.id
                         ? "bg-green-100 text-green-700 shadow-lg transform scale-105"
                         : "hover:bg-green-100 hover:text-green-700 hover:shadow-md hover:transform hover:scale-105"
                     }`}
                  >
                                         <div className={`p-2 rounded-lg transition-all duration-300 ${
                       activeTab === item.id 
                         ? "bg-green-200" 
                         : "bg-green-100 group-hover:bg-green-200"
                     }`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    {item.name}
                    {item.id !== "overview" && (
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </div>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                    Welcome to NDAREHE
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Discover everything Rwanda has to offer through our comprehensive travel services.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {services.map((service) => (
                    <Card key={service.id} className="group hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg overflow-hidden">
                      <div className="relative">
                        <div className={`absolute inset-0 bg-gradient-to-br ${service.color.replace('50', '100')} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                        <CardHeader className="pb-3 relative z-10">
                          <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-xl ${service.color} group-hover:scale-110 transition-transform duration-300`}>
                              <service.icon className="h-8 w-8" />
                            </div>
                            <CardTitle className="text-xl">{service.title}</CardTitle>
                          </div>
                          <CardDescription className="text-base">{service.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 relative z-10">
                          <Button asChild className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                            <Link to={service.href}>
                              Explore {service.title}
                            </Link>
                          </Button>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab !== "overview" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("overview")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Overview
                  </Button>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold mb-4">
                    {services.find(s => s.id === activeTab)?.title}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {services.find(s => s.id === activeTab)?.description}
                  </p>
                </div>
                
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-muted-foreground">
                      Click the button below to explore this service in detail.
                    </p>
                    <div className="mt-4 text-center">
                      <Button asChild>
                        <Link to={services.find(s => s.id === activeTab)?.href || "/"}>
                          Explore {services.find(s => s.id === activeTab)?.title}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Explore; 