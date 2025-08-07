import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar, DollarSign, Heart, Briefcase, Baby } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TripPlanner = () => {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const form = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      arrivalDate: "",
      departureDate: "",
      budget: "",
      tripType: "",
      groupSize: "",
      accommodation: "",
      interests: [],
      specialRequests: "",
      previousVisit: ""
    }
  });

  const onSubmit = (data: any) => {
    console.log("Trip planning form submitted:", data);
    setIsSubmitted(true);
    toast({
      title: "Trip Plan Request Submitted!",
      description: "Our local experts will contact you within 24 hours with personalized recommendations.",
    });
  };

  const tripTypes = [
    { id: "business", label: "Business", icon: Briefcase },
    { id: "family", label: "Family", icon: Baby },
    { id: "romantic", label: "Romantic", icon: Heart },
    { id: "adventure", label: "Adventure", icon: MapPin },
    { id: "cultural", label: "Cultural", icon: Users },
    { id: "relaxation", label: "Relaxation", icon: Heart }
  ];

  const interests = [
    "Gorilla Trekking", "Cultural Tours", "City Exploration", "Nature & Wildlife",
    "Coffee Tourism", "Local Markets", "Nightlife", "Photography",
    "History & Museums", "Adventure Sports", "Lake Activities", "Food Experiences"
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
              <p className="text-xl text-muted-foreground mb-6">
                Your trip planning request has been submitted successfully.
              </p>
              <div className="bg-muted/50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold mb-4">What happens next?</h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-primary rounded-full text-white text-xs flex items-center justify-center mr-3">1</div>
                    <span className="text-sm">Our local experts review your preferences</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-primary rounded-full text-white text-xs flex items-center justify-center mr-3">2</div>
                    <span className="text-sm">We create a personalized itinerary for you</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-primary rounded-full text-white text-xs flex items-center justify-center mr-3">3</div>
                    <span className="text-sm">You'll receive recommendations within 24 hours</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <Button asChild>
                  <a href="/">Return to Home</a>
                </Button>
                <div className="text-sm text-muted-foreground">
                  Questions? Contact us at <a href="mailto:info@ndarehe.com" className="text-primary hover:underline">info@ndarehe.com</a>
                </div>
              </div>
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
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Plan Your Perfect Rwanda Trip</h1>
          <p className="text-muted-foreground">Tell us about your preferences and we'll create a personalized itinerary for you</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+250 xxx xxx xxx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Trip Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Trip Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="arrivalDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Arrival Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="departureDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Departure Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="groupSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Group Size *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select group size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">Solo Traveler</SelectItem>
                                <SelectItem value="2">2 People</SelectItem>
                                <SelectItem value="3-5">3-5 People</SelectItem>
                                <SelectItem value="6-10">6-10 People</SelectItem>
                                <SelectItem value="10+">10+ People</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget Range (USD) *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select budget range" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                                <SelectItem value="500-1000">RWF 500,000 - RWF 1,000,000</SelectItem>
                <SelectItem value="1000-2500">RWF 1,000,000 - RWF 2,500,000</SelectItem>
                <SelectItem value="2500-5000">RWF 2,500,000 - RWF 5,000,000</SelectItem>
                <SelectItem value="5000+">RWF 5,000,000+</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Trip Type */}
                <Card>
                  <CardHeader>
                    <CardTitle>What type of trip is this?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="tripType"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-2 md:grid-cols-3 gap-4"
                            >
                              {tripTypes.map((type) => (
                                <FormItem key={type.id}>
                                  <FormControl>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value={type.id} id={type.id} />
                                      <Label htmlFor={type.id} className="flex items-center cursor-pointer">
                                        <type.icon className="h-4 w-4 mr-2" />
                                        {type.label}
                                      </Label>
                                    </div>
                                  </FormControl>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Interests */}
                <Card>
                  <CardHeader>
                    <CardTitle>What interests you most?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {interests.map((interest) => (
                        <div key={interest} className="flex items-center space-x-2">
                          <Checkbox id={interest} />
                          <Label htmlFor={interest} className="text-sm cursor-pointer">{interest}</Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="accommodation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Accommodation Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select accommodation preference" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="luxury">Luxury Hotels</SelectItem>
                              <SelectItem value="mid-range">Mid-Range Hotels</SelectItem>
                              <SelectItem value="budget">Budget-Friendly</SelectItem>
                              <SelectItem value="local">Local Guesthouses</SelectItem>
                              <SelectItem value="mix">Mix of Options</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="previousVisit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Have you visited Rwanda before?</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="no">First time visit</SelectItem>
                              <SelectItem value="yes-recent">Yes, within last 2 years</SelectItem>
                              <SelectItem value="yes-long">Yes, more than 2 years ago</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specialRequests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Requests or Requirements</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us about any dietary restrictions, accessibility needs, special occasions, or specific things you'd like to include in your trip..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Button type="submit" size="lg" className="w-full">
                  Submit Trip Planning Request
                </Button>
              </form>
            </Form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Why Use Our Trip Planner?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Local Expertise</h4>
                    <p className="text-sm text-muted-foreground">Our team knows Rwanda inside and out</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Personalized</h4>
                    <p className="text-sm text-muted-foreground">Tailored recommendations based on your interests</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Best Value</h4>
                    <p className="text-sm text-muted-foreground">Competitive prices and insider deals</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Rwanda Experiences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "Gorilla Trekking in Volcanoes National Park",
                    "Kigali City Cultural Tour",
                    "Lake Kivu Boat Trips",
                    "Coffee Plantation Visits",
                    "Traditional Cooking Classes"
                  ].map((experience) => (
                    <Badge key={experience} variant="secondary" className="text-xs w-full justify-start p-2">
                      {experience}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TripPlanner;