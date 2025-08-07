import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Award, Globe } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const About = () => {
  const values = [
    {
      icon: Heart,
      title: "Authentic Experiences",
      description: "We connect you with genuine Rwandan culture and local communities"
    },
    {
      icon: Users,
      title: "Community Impact",
      description: "Supporting local businesses and creating sustainable tourism opportunities"
    },
    {
      icon: Award,
      title: "Quality Assurance",
      description: "All our accommodations and experiences are carefully vetted for quality"
    },
    {
      icon: Globe,
      title: "Accessibility",
      description: "Making Rwanda accessible to travelers from all backgrounds and budgets"
    }
  ];

  const team = [
    {
      name: "Assia Teta",
      role: "Backend Developer & Co-Founder",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      description: "Passionate about technology and Rwanda's tourism potential"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-green-600/90 to-green-800/90 text-white">
        <div className="absolute inset-0 bg-[url('/src/rwanda_main.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/80 to-green-800/80"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-white/20 rounded-full animate-ping"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/15 rounded-full animate-bounce"></div>
        </div>
        <div className="relative container mx-auto px-4 z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">About NDAREHE</h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 animate-fade-in-delay">
              Connecting travelers with authentic Rwandan experiences since 2024
            </p>
            <Badge className="text-lg px-4 py-2 bg-white text-green-700 animate-fade-in-delay-2 hover:shadow-lg hover:scale-105 hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer">Where to stay in Rwanda 🇷🇼</Badge>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-xl text-muted-foreground">
                To make Rwanda's beauty, culture, and hospitality accessible to every traveler
              </p>
            </div>
            
            <div className="prose prose-lg mx-auto text-muted-foreground">
              <p>
                NDAREHE was born from a simple belief: that every traveler deserves to experience 
                the authentic beauty of Rwanda, regardless of their budget or travel style. Our name, 
                derived from Kinyarwanda meaning "where to stay," reflects our core mission of 
                helping visitors find their perfect home away from home.
              </p>
              
              <p>
                We specialize in connecting travelers with verified accommodations, reliable 
                transportation, and unforgettable local experiences across Rwanda. From the 
                bustling streets of Kigali to the serene shores of Lake Kivu, from budget-friendly 
                guesthouses to luxury hotels, we ensure every journey is memorable and meaningful.
              </p>
              
              <p>
                Our platform is more than just a booking service – it's a bridge between cultures, 
                a supporter of local communities, and a gateway to discovering the Land of a 
                Thousand Hills in all its glory.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-xl text-muted-foreground">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-xl text-muted-foreground">
              The passionate people behind NDAREHE
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
              {team.map((member, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-full">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                    <p className="text-primary font-medium mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground">{member.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">500+</div>
              <div className="text-primary-foreground/80">Verified Accommodations</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">10,000+</div>
              <div className="text-primary-foreground/80">Happy Travelers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">50+</div>
              <div className="text-primary-foreground/80">Local Experiences</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">24/7</div>
              <div className="text-primary-foreground/80">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Explore Rwanda?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who have discovered the beauty of Rwanda through NDAREHE
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Button asChild size="lg">
                              <a href="/accommodations">Start Your Journey</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/contact">Contact Us</a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;