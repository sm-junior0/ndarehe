import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, Search, Tag, ArrowRight, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  readTime: string;
  category: string;
  image: string;
  tags: string[];
}

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const blogPosts: BlogPost[] = [
    {
      id: "1",
      title: "Top 10 Must-Visit Places in Kigali",
      excerpt: "Discover the hidden gems and popular attractions that make Kigali a must-visit destination for travelers.",
      content: `Kigali, the capital of Rwanda, is a city that beautifully blends modernity with tradition. This vibrant metropolis offers visitors a unique experience that combines the warmth of African hospitality with the efficiency of a well-planned city.

## 1. Kigali Genocide Memorial
The Kigali Genocide Memorial serves as both a museum and a burial ground for over 250,000 victims of the 1994 genocide. This powerful and moving site provides visitors with a deep understanding of Rwanda's history and the country's remarkable journey toward reconciliation and peace.

## 2. Kimironko Market
Experience the authentic local life at Kimironko Market, one of Kigali's largest and most vibrant markets. Here you'll find everything from fresh produce and traditional fabrics to handmade crafts and local delicacies. The market is a perfect place to practice your bargaining skills and immerse yourself in the daily rhythm of Kigali life.

## 3. Inema Arts Center
For art enthusiasts, the Inema Arts Center is a must-visit destination. This creative hub showcases the work of local and international artists, offering visitors a glimpse into Rwanda's contemporary art scene. The center also hosts workshops and cultural events throughout the year.

## 4. Nyamirambo Women's Center
The Nyamirambo Women's Center offers guided walking tours through one of Kigali's most historic neighborhoods. These tours, led by local women, provide insights into the community's history, culture, and daily life, while supporting local women's empowerment initiatives.

## 5. Kigali Convention Centre
The iconic Kigali Convention Centre, with its distinctive dome-shaped design, is a symbol of Rwanda's modern aspirations. While primarily a business venue, the building's architecture and the surrounding area offer excellent photo opportunities and a glimpse into Rwanda's future.

## 6. Hotel des Mille Collines
Made famous by the film "Hotel Rwanda," the Hotel des Mille Collines offers visitors a chance to stay at or visit this historic property. The hotel's pool area is particularly popular for its stunning views of the city and surrounding hills.

## 7. Kigali Public Library
The Kigali Public Library, located in the heart of the city, is not just a place for books but also a community hub. The library's modern architecture and peaceful atmosphere make it a perfect spot for visitors to relax and learn more about Rwanda's educational initiatives.

## 8. Nyarutarama Golf Course
For sports enthusiasts, the Nyarutarama Golf Course offers a unique golfing experience with stunning views of the city and surrounding hills. The course is open to visitors and provides a peaceful escape from the city's hustle and bustle.

## 9. Kigali Heights Shopping Mall
For those looking for modern amenities, Kigali Heights offers a contemporary shopping experience with international brands, restaurants, and entertainment options. The mall's rooftop provides excellent views of the city.

## 10. Local Coffee Shops
Rwanda is famous for its coffee, and Kigali has numerous excellent coffee shops where you can sample the country's finest brews. Places like Question Coffee and Bourbon Coffee offer not just great coffee but also insights into Rwanda's coffee culture.

## Tips for Visiting Kigali
- The best time to visit is during the dry seasons (June to September and December to February)
- Public transportation is reliable and affordable
- The city is very safe for tourists
- English, French, and Kinyarwanda are widely spoken
- Remember to dress modestly and respect local customs

Kigali's unique combination of history, culture, and modernity makes it a fascinating destination for travelers seeking an authentic African experience.`,
      author: "Ndarehe Team",
      publishedAt: "2024-01-15",
      readTime: "5 min read",
      category: "Travel Tips",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      tags: ["Kigali", "Travel", "Attractions", "City Guide"]
    },
    {
      id: "2",
      title: "Best Time to Visit Rwanda for Gorilla Trekking",
      excerpt: "Plan your perfect gorilla trekking adventure with our comprehensive guide to the best seasons and weather conditions.",
      content: `Gorilla trekking in Rwanda is a once-in-a-lifetime experience that requires careful planning, especially when it comes to timing your visit. The Volcanoes National Park, home to the endangered mountain gorillas, offers different experiences throughout the year.

## Understanding Rwanda's Climate
Rwanda experiences two main seasons: the dry season and the wet season. The dry season runs from June to September and December to February, while the wet season occurs from March to May and October to November.

## Best Time for Gorilla Trekking: Dry Season
The dry season (June to September and December to February) is considered the optimal time for gorilla trekking for several reasons:

### Advantages of Dry Season Trekking:
- **Better Trail Conditions**: Trails are less muddy and slippery, making the trek easier and safer
- **Clearer Views**: Less rainfall means better visibility for photography and observation
- **More Comfortable Hiking**: Cooler temperatures and less humidity make the physical exertion more manageable
- **Higher Success Rates**: Gorillas are more likely to be found in predictable locations
- **Better Photography**: Clearer skies and better lighting conditions

## Wet Season Considerations
While the dry season is preferred, the wet season (March to May and October to November) also has its advantages:

### Wet Season Benefits:
- **Fewer Crowds**: Less competition for permits and smaller group sizes
- **Lush Vegetation**: The landscape is more vibrant and photogenic
- **Lower Prices**: Some lodges offer discounted rates during the low season
- **Unique Experience**: Trekking in the rain can be an adventure in itself

## Monthly Breakdown

### January - February
- **Weather**: Dry and warm
- **Pros**: Excellent trekking conditions, clear views
- **Cons**: Peak season, higher prices, more crowds

### March - May
- **Weather**: Wet season with heavy rains
- **Pros**: Fewer tourists, lush landscapes, lower prices
- **Cons**: Muddy trails, limited visibility, more challenging trekking

### June - September
- **Weather**: Dry season with cool temperatures
- **Pros**: Best trekking conditions, clear skies, comfortable temperatures
- **Cons**: Peak season, higher prices

### October - November
- **Weather**: Short rainy season
- **Pros**: Fewer crowds, beautiful landscapes
- **Cons**: Unpredictable weather, muddy conditions

### December
- **Weather**: Beginning of dry season
- **Pros**: Good trekking conditions, holiday atmosphere
- **Cons**: Peak season prices, more tourists

## Planning Your Trip

### Permit Availability
Gorilla trekking permits are limited to 96 per day and often sell out months in advance, especially during peak season. Book your permits at least 6-12 months ahead for the dry season.

### Physical Preparation
Regardless of the season, gorilla trekking requires a moderate level of fitness. The trek can take anywhere from 30 minutes to 6 hours, depending on the gorillas' location.

### What to Pack
- **Dry Season**: Light layers, sun protection, comfortable hiking boots
- **Wet Season**: Waterproof gear, extra layers, sturdy waterproof boots

## Alternative Activities
If you visit during the wet season, consider combining your gorilla trek with other activities:
- Golden monkey trekking
- Hiking to Dian Fossey's grave
- Cultural village visits
- Lake Kivu relaxation

## Final Recommendations
- **First-time visitors**: Choose the dry season (June to September) for the best experience
- **Budget travelers**: Consider the wet season for lower prices
- **Photographers**: Dry season offers better lighting and visibility
- **Adventure seekers**: Wet season provides a more challenging and unique experience

Remember, regardless of when you visit, seeing mountain gorillas in their natural habitat is an unforgettable experience that will stay with you for a lifetime.`,
      author: "Wildlife Expert",
      publishedAt: "2024-01-10",
      readTime: "7 min read",
      category: "Wildlife",
      image: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      tags: ["Gorillas", "Wildlife", "Volcanoes National Park", "Trekking"]
    },
    {
      id: "3",
      title: "Traditional Rwandan Cuisine: A Food Lover's Guide",
      excerpt: "Explore the rich flavors and traditional dishes that make Rwandan cuisine unique and delicious.",
      content: "Rwandan cuisine is a reflection of the country's agricultural heritage and cultural diversity...",
      author: "Food Blogger",
      publishedAt: "2024-01-08",
      readTime: "6 min read",
      category: "Food & Culture",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      tags: ["Food", "Culture", "Traditional", "Cuisine"]
    },
    {
      id: "4",
      title: "Budget Travel in Rwanda: How to Explore on a Shoestring",
      excerpt: "Discover how to experience the best of Rwanda without breaking the bank with our budget travel tips.",
      content: "Rwanda offers incredible experiences for travelers on any budget. Here's how to make the most of your money...",
      author: "Budget Traveler",
      publishedAt: "2024-01-05",
      readTime: "8 min read",
      category: "Travel Tips",
      image: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      tags: ["Budget", "Travel", "Tips", "Affordable"]
    },
    {
      id: "5",
      title: "Cultural Experiences: Immersing Yourself in Rwandan Traditions",
      excerpt: "Learn about the rich cultural heritage of Rwanda and how to respectfully engage with local traditions.",
      content: "Rwanda's cultural heritage is as diverse as its landscape, offering visitors unique opportunities to connect...",
      author: "Cultural Guide",
      publishedAt: "2024-01-03",
      readTime: "6 min read",
      category: "Culture",
      image: "https://images.unsplash.com/photo-1568667256549-094345857637?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      tags: ["Culture", "Traditions", "Heritage", "Local Life"]
    },
    {
      id: "6",
      title: "Safety Tips for Traveling in Rwanda",
      excerpt: "Essential safety information and travel advice to ensure a secure and enjoyable trip to Rwanda.",
      content: "Rwanda is one of the safest countries in Africa, but it's always important to be prepared...",
      author: "Travel Safety Expert",
      publishedAt: "2024-01-01",
      readTime: "4 min read",
      category: "Travel Tips",
      image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      tags: ["Safety", "Travel", "Tips", "Security"]
    }
  ];

  const categories = [
    { id: "all", name: "All Posts" },
    { id: "Travel Tips", name: "Travel Tips" },
    { id: "Wildlife", name: "Wildlife" },
    { id: "Food & Culture", name: "Food & Culture" },
    { id: "Culture", name: "Culture" }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild className="hover:bg-green-50 hover:text-green-700 transition-all duration-300">
              <Link to="/explore">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Explore
              </Link>
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              Blog & Travel Tips
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the best of Rwanda through our curated articles, travel tips, and local insights
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Post */}
        {filteredPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Featured Article</h2>
            <Card className="overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <img
                    src={filteredPosts[0].image}
                    alt={filteredPosts[0].title}
                    className="w-full h-64 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-1/2 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{filteredPosts[0].category}</Badge>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{filteredPosts[0].readTime}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{filteredPosts[0].title}</h3>
                  <p className="text-muted-foreground mb-4">{filteredPosts[0].excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {filteredPosts[0].author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(filteredPosts[0].publishedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button asChild>
                      <Link to={`/blog/${filteredPosts[0].id}`}>
                        Read More
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.slice(1).map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">{post.category}</Badge>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{post.readTime}</span>
                </div>
                <h3 className="text-xl font-bold mb-3 line-clamp-2">{post.title}</h3>
                <p className="text-muted-foreground mb-4 line-clamp-3">{post.excerpt}</p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {post.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/blog/${post.id}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Stay Updated</h3>
              <p className="text-primary-foreground/80 mb-6">
                Get the latest travel tips and updates delivered to your inbox
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input
                  placeholder="Enter your email"
                  className="bg-white text-black"
                />
                <Button variant="secondary">
                  Subscribe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Blog;