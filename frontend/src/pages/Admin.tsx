import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Hotel, 
  MapPin, 
  FileText, 
  Settings, 
  Eye, 
  Edit, 
  Trash2,
  Plus,
  Download
} from "lucide-react";

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  // Mock data - in real app this would come from API
  const stats = [
    { title: "Total Bookings", value: "1,234", icon: FileText },
    { title: "Active Listings", value: "156", icon: Hotel },
    { title: "Users", value: "890", icon: Users },
            { title: "Revenue", value: "RWF 45,678,000", icon: MapPin }
  ];

  const recentBookings = [
    {
      id: "NDH-001",
      user: "John Doe",
      service: "Kigali Heights Hotel",
      date: "2024-12-15",
              amount: "RWF 240,000",
      status: "confirmed"
    },
    {
      id: "NDH-002",
      user: "Jane Smith",
      service: "Airport Pickup",
      date: "2024-12-14",
              amount: "RWF 50,000",
      status: "pending"
    },
    {
      id: "NDH-003",
      user: "Bob Johnson",
      service: "City Tour",
      date: "2024-12-13",
              amount: "RWF 90,000",
      status: "completed"
    }
  ];

  const accommodations = [
    {
      id: 1,
      name: "Kigali Heights Hotel",
      type: "Hotel",
      location: "Kigali",
              price: "RWF 120,000/night",
      status: "active"
    },
    {
      id: 2,
      name: "Lake Kivu Villa",
      type: "Villa",
      location: "Lake Kivu",
              price: "RWF 200,000/night",
      status: "active"
    },
    {
      id: 3,
      name: "Nyamirambo Guesthouse",
      type: "Guesthouse",
      location: "Nyamirambo",
              price: "RWF 45,000/night",
      status: "inactive"
    }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple demo login - in real app this would validate against backend
    if (loginForm.email === "admin@ndarehe.com" && loginForm.password === "admin123") {
      setIsLoggedIn(true);
    } else {
      alert("Invalid credentials. Try admin@ndarehe.com / admin123");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <p className="text-muted-foreground">Access NDAREHE Admin Panel</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  placeholder="admin@ndarehe.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  placeholder="Enter password"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
              <div className="text-xs text-center text-muted-foreground">
                Demo credentials: admin@ndarehe.com / admin123
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src="/favicon.png"
              alt="NDAREHE"
              className="h-8 w-auto"
            />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Welcome, Admin</span>
            <Button variant="outline" size="sm" onClick={() => setIsLoggedIn(false)}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="accommodations">Accommodations</TabsTrigger>
            <TabsTrigger value="experiences">Experiences</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Bookings</CardTitle>
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">{booking.id}</p>
                            <p className="text-sm text-muted-foreground">{booking.user}</p>
                          </div>
                          <div>
                            <p className="font-medium">{booking.service}</p>
                            <p className="text-sm text-muted-foreground">{booking.date}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-bold">{booking.amount}</p>
                          <Badge variant={booking.status === "confirmed" ? "default" : booking.status === "pending" ? "secondary" : "outline"}>
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accommodations">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Manage Accommodations</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accommodations.map((accommodation) => (
                    <div key={accommodation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">{accommodation.name}</p>
                            <p className="text-sm text-muted-foreground">{accommodation.type} • {accommodation.location}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-bold">{accommodation.price}</p>
                          <Badge variant={accommodation.status === "active" ? "default" : "secondary"}>
                            {accommodation.status}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experiences">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Manage Experiences</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No experiences yet</h3>
                  <p className="text-muted-foreground mb-4">Start by adding your first local experience or tour.</p>
                  <Button>Add First Experience</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>This Month</span>
                      <span className="font-bold">RWF 12,345,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Month</span>
                      <span className="font-bold">RWF 10,678,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>This Year</span>
                      <span className="font-bold">RWF 145,890,000</span>
                    </div>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Full Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Booking Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Bookings</span>
                      <span className="font-bold">1,234</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confirmed</span>
                      <span className="font-bold text-green-600">987</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending</span>
                      <span className="font-bold text-yellow-600">123</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cancelled</span>
                      <span className="font-bold text-red-600">124</span>
                    </div>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;