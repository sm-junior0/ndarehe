import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Award, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";


const CountUp = ({ end, duration = 1500, suffix = "" }: { end: number; duration?: number; suffix?: string }) => {
  const [value, setValue] = useState(0);
  const [hasRun, setHasRun] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasRun) {
        setHasRun(true);
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const current = Math.floor(end * progress);
          setValue(current);
          if (progress < 1) requestAnimationFrame(animate);
          else setValue(end);
        };
        requestAnimationFrame(animate);
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, hasRun]);

  const formatted = value.toLocaleString();

  return <div ref={ref} className="text-3xl md:text-4xl font-bold mb-2">{formatted}{suffix}</div>;
};

const ReviewCard = ({ review, highlight = false, compact = false }) => (
  <Card
    className={`h-full text-center rounded-2xl transition-all duration-500 ${highlight ? "border-2 border-primary/30 shadow-xl" : "shadow-sm"
      }`}
  >
    <CardContent className="p-6">
      <div className="w-20 h-20 mx-auto mb-4 overflow-hidden rounded-full border-4 border-primary/20 shadow-md">
        <img
          src={review.image}
          alt={review.name}
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="text-xl font-semibold">{review.name}</h3>
      <p className="text-muted-foreground mb-2">
        {review.country} {review.flag}
      </p>

      {/* Stars */}
      {highlight && (
        <div className="flex justify-center mb-3 text-yellow-400">
          {"★★★★★"}
        </div>
      )}

      <p className={`italic ${compact ? "line-clamp-3 text-sm" : "text-lg animate-fade-in"}`}>
        "{review.text}"
      </p>
    </CardContent>
  </Card>
);



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
      name: "John Doe",
      role: "Team Member",
      image: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      description: "Dedicated to delivering great experiences"
    },
    {
      name: "John Doe",
      role: "Team Member",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      description: "Committed to customer success"
    },
    {
      name: "John Doe",
      role: "Team Member",
      image: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      description: "Passionate about Rwanda tourism"
    }
  ];

  const reviews = [
    {
      name: "Mbabazi Precious",
      country: "Uganda",
      flag: "🇺🇬",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      text: "NDAREHE made my stay in Rwanda unforgettable! The accommodations were authentic and the local experiences were truly immersive. I felt connected to the culture in ways I never expected."
    },
    {
      name: "Lucy Mai",
      country: "Kenya",
      flag: "🇰🇪",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      text: "As a frequent traveler in East Africa, I can confidently say NDAREHE offers the best curated experiences in Rwanda. Their attention to detail and customer support is exceptional."
    },
    {
      name: "Rhoda Lise",
      country: "Zambia",
      flag: "🇿🇲",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      text: "The community impact focus of NDAREHE impressed me the most. I knew my travel was directly supporting local businesses. The accommodations were comfortable and authentic."
    },
    {
      name: "Louise Nyiraneza",
      country: "Rwanda",
      flag: "🇷🇼",
      image: "https://images.unsplash.com/photo-1552058544-f2b08422138a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      text: "As a local, I'm proud of how NDAREHE showcases the beauty of Rwanda. They've helped me discover places in my own country that I never knew existed!"
    },
    {
      name: "Isaro Chadia",
      country: "Rwanda",
      flag: "🇷🇼",
      image: "https://images.unsplash.com/photo-1500048993953-d23a43626643?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      text: "NDAREHE's platform is so easy to use! I found the perfect accommodation for my family vacation within minutes. Their customer service team was incredibly helpful too."
    },
    {
      name: "Benito Ineza",
      country: "Rwanda",
      flag: "🇷🇼",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      text: "I've used NDAREHE multiple times for both business and personal travel. They consistently deliver quality experiences that represent the best of Rwandan hospitality."
    },
    {
      name: "Willy Wallet",
      country: "UK",
      flag: "🇬🇧",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      text: "Coming from the UK, I was amazed by the value NDAREHE provides. The experiences were authentic and well-priced. I'll definitely use them again on my next visit to Rwanda."
    },
    {
      name: "Chloe Rotereau",
      country: "France",
      flag: "🇫🇷",
      image: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      text: "Magnifique! NDAREHE helped me experience the true heart of Rwanda. The cultural immersion was authentic, and the accommodations were charming with modern comforts."
    },
    {
      name: "Nelly Munyes",
      country: "Rwanda",
      flag: "🇷🇼",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      text: "NDAREHE understands what travelers want. Their curated experiences showcase the diversity of Rwanda - from bustling Kigali to serene Lake Kivu. Highly recommended!"
    },
    {
      name: "George Wycliffe",
      country: "USA",
      flag: "🇺🇸",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      text: "From the USA to Rwanda, NDAREHE made the entire process seamless. Their 24/7 support was invaluable when I had questions about my itinerary. A truly professional service!"
    }
  ];

  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  const goToReview = (index: number) => {
  setCurrentReviewIndex((index + reviews.length) % reviews.length);
  stopAutoSlide();
  startAutoSlide();
};

const nextReview = () => goToReview(currentReviewIndex + 1);
const prevReview = () => goToReview(currentReviewIndex - 1);




  const startAutoSlide = () => {
  if (autoSlideRef.current) return; // avoid duplicates

  autoSlideRef.current = setInterval(() => {
    setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
  }, 10000); // fixed 5s per review
};

const stopAutoSlide = () => {
  if (autoSlideRef.current) {
    clearInterval(autoSlideRef.current);
    autoSlideRef.current = null;
  }
};

  // Start auto-slide on mount
  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide(); // cleanup on unmount
  }, []);

  // Function to get the review index for display (handles wrapping around the array)
  const getDisplayIndex = (offset) => {
    let index = currentReviewIndex + offset;
    if (index < 0) index = reviews.length + index;
    if (index >= reviews.length) index = index - reviews.length;
    return index;
  };

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

            <div className="prose prose-lg mx-auto text-muted-foreground grid gap-6">
              <p>
                <span className="font-semibold">NDAREHE</span> was founded in 2022, in the wake of the coronavirus pandemic that had severely impacted the global economy. As the world began to recover, we stayed true to our belief that travel should remain affordable, accessible, and memorable.
              </p>
              <p>
                Born from a simple vision, that every traveller deserves to experience the authentic beauty of Rwanda, regardless of budget or travel style. <span className="font-semibold">NDAREHE</span> takes its name from the Kinyarwanda word meaning <span className="font-semibold">“where to stay.”</span> This reflects our core mission: Promoting local tourism and helping both local and international visitors find their perfect home away from home.
              </p>
              <p>
                Through strategic investment in technology, we specialize in connecting travellers with verified accommodations, reliable transportation, and unforgettable local experiences across Rwanda. From the vibrant streets of Kigali to the tranquil shores of Lake Kivu, and from budget-friendly guesthouses to luxury hotels, we make every journey meaningful and memorable.
              </p>
              <p>
                More than just a booking platform, <span className="font-semibold">NDAREHE</span> is a bridge between cultures, a supporter of local businesses and communities, and a gateway to discovering the Land of a Thousand Hills in all its richness. Wherever you want to go and whatever you plan to do, NDAREHE is here to make it simple, seamless, and supported by 24/7 customer care.
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
              <CountUp end={500} suffix="+" />
              <div className="text-primary-foreground/80">Verified Accommodations</div>
            </div>
            <div>
              <CountUp end={10000} suffix="+" />
              <div className="text-primary-foreground/80">Happy Travelers</div>
            </div>
            <div>
              <CountUp end={50} suffix="+" />
              <div className="text-primary-foreground/80">Local Experiences</div>
            </div>
            <div>
              <CountUp end={24} suffix="/7" />
              <div className="text-primary-foreground/80">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      {/* Reviews Section */}
      <section className="py-20 bg-gradient-to-br from-muted/40 via-white to-muted/30 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Traveler Experiences</h2>
            <p className="text-lg text-muted-foreground">
              Real stories from people who explored Rwanda with NDAREHE
            </p>
          </div>

          <div
            className="max-w-5xl mx-auto relative group"
            onMouseEnter={stopAutoSlide}
            onMouseLeave={startAutoSlide}
          >
            {/* Left arrow */}
            <button
              onClick={prevReview}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-background/90 backdrop-blur-md rounded-full p-3 shadow-lg hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100"
              aria-label="Previous review"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Reviews container */}
            <div className="flex items-center justify-center gap-6 transition-transform duration-700 ease-in-out">
              {/* Previous */}
              <div className="hidden sm:block w-1/4 opacity-50 scale-90 blur-sm">
                <ReviewCard review={reviews[getDisplayIndex(-1)]} compact />
              </div>

              {/* Current */}
              <div className="w-full sm:w-2/4 scale-105 shadow-2xl relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentReviewIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  >
                    <ReviewCard review={reviews[currentReviewIndex]} highlight />
                  </motion.div>
                </AnimatePresence>
              </div>


              {/* Next */}
              <div className="hidden sm:block w-1/4 opacity-50 scale-90 blur-sm">
                <ReviewCard review={reviews[getDisplayIndex(1)]} compact />
              </div>
            </div>

            {/* Right arrow */}
            <button
              onClick={nextReview}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-background/90 backdrop-blur-md rounded-full p-3 shadow-lg hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100"
              aria-label="Next review"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center mt-8 space-x-3">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => goToReview(index)}  // ✅ use goToReview
                className={`w-3 h-3 rounded-full transition-all ${index === currentReviewIndex
                    ? "bg-primary scale-125 shadow-md"
                    : "bg-muted hover:bg-primary/40"
                  }`}
              />
            ))}
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