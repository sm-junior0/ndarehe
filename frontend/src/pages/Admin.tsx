import { useEffect, useMemo, useState } from "react";
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
import { useAuth } from "@/hooks/useAuth";

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  type StatItem = { title: string; value: string | number; icon: React.ComponentType<Record<string, unknown>> };
  const [stats, setStats] = useState<StatItem[]>([
    { title: "Total Bookings", value: "-", icon: FileText },
    { title: "Active Listings", value: "-", icon: Hotel },
    { title: "Users", value: "-", icon: Users },
    { title: "Pending Requests", value: "-", icon: FileText }
  ]);

  type PendingPayload = {
    pendingBookings: unknown[];
    pendingTripPlans: unknown[];
    unverifiedAccommodations: unknown[];
    unverifiedTransportation: unknown[];
  };
  const [recentBookings, setRecentBookings] = useState<unknown[]>([]);
  const [pending, setPending] = useState<PendingPayload>({ pendingBookings: [], pendingTripPlans: [], unverifiedAccommodations: [], unverifiedTransportation: [] });

  useEffect(() => {
    if (user?.role === 'ADMIN' && token) {
      setIsLoggedIn(true);
      setLoading(true);
      setError(null);
      Promise.all([
        fetch('/api/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/admin/pending', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
      ])
      .then(([dash, pend]) => {
        if (dash?.success && dash?.data?.stats) {
          const s = dash.data.stats;
          const totalListings = (Number(s.totalAccommodations || 0) + Number(s.totalTransportation || 0) + Number(s.totalTours || 0));
          const pendingRequests = (Number(s.pendingBookings || 0) + Number(s.pendingTripPlans || 0));
          setStats([
            { title: "Total Bookings", value: (s.totalBookings ?? '-'), icon: FileText },
            { title: "Active Listings", value: (isNaN(totalListings) ? '-' : totalListings), icon: Hotel },
            { title: "Users", value: (s.totalUsers ?? '-'), icon: Users },
            { title: "Pending Requests", value: (isNaN(pendingRequests) ? '-' : pendingRequests), icon: FileText }
          ]);
        }
        if (dash?.success && dash?.data?.recentBookings) {
          setRecentBookings(dash.data.recentBookings);
        }
        if (pend?.success && pend?.data) {
          setPending(pend.data);
        }
      })
      .catch((e) => setError(e?.message || 'Failed to load admin data'))
      .finally(() => setLoading(false));
    }
  }, [user?.role, token]);

  // Mock fallback if not logged in as admin
  const showMock = useMemo(() => !isLoggedIn, [isLoggedIn]);

  // Mock data - used only when not logged in
  const mockRecentBookings = [
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
            {error && (
              <div className="mb-4 text-sm text-red-600">{error}</div>
            )}
            {loading && (
              <div className="mb-4 text-sm text-muted-foreground">Loading admin data...</div>
            )}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Bookings</CardTitle>
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(showMock ? mockRecentBookings : (recentBookings as any[])).map((booking) => (
                    <div key={(booking as any).id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">{(booking as any).id}</p>
                            <p className="text-sm text-muted-foreground">{(booking as any).user ?? `${(booking as any).user?.firstName ?? ''} ${(booking as any).user?.lastName ?? ''}`}</p>
                          </div>
                          <div>
                            <p className="font-medium">{(booking as any).service ?? (booking as any).accommodation?.name ?? (booking as any).transportation?.name ?? (booking as any).tour?.name}</p>
                            <p className="text-sm text-muted-foreground">{(booking as any).date ?? new Date((booking as any).createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-bold">{(booking as any).amount ?? ((booking as any).payment?.amount ? `RWF ${(booking as any).payment?.amount}` : '—')}</p>
                          <Badge variant={(booking as any).status === "confirmed" || (booking as any).status === "CONFIRMED" ? "default" : (booking as any).status === "pending" || (booking as any).status === "PENDING" ? "secondary" : "outline"}>
                            {(booking as any).status?.toString().toLowerCase?.() || 'pending'}
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

            {/* Pending Requests Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pending Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Bookings awaiting confirmation</p>
                        <p className="text-2xl font-bold">{showMock ? 123 : (pending.pendingBookings as unknown[]).length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Trip plan requests</p>
                        <p className="text-2xl font-bold">{showMock ? 45 : (pending.pendingTripPlans as unknown[]).length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Unverified accommodations</p>
                        <p className="text-2xl font-bold">{showMock ? 4 : (pending.unverifiedAccommodations as unknown[]).length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Unverified transportation</p>
                        <p className="text-2xl font-bold">{showMock ? 7 : (pending.unverifiedTransportation as unknown[]).length}</p>
                      </div>
                    </div>
                  </div>
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