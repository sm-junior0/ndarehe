import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Calendar,
  CreditCard,
  Settings,
  LogOut,
  Edit,
  Save,
  Star,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Home,
  Car,
  Map,
  BookOpen
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { userApi, bookingsApi } from "@/lib/api";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  isEmailVerified: boolean;
  createdAt: string;
}

interface Booking {
  id: string;
  serviceType: 'ACCOMMODATION' | 'TRANSPORTATION' | 'TOUR';
  serviceName: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  startDate: string;
  endDate?: string;
  totalAmount: number;
  participants: number;
  createdAt: string;
}

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    isEmailVerified: false,
    createdAt: ""
  });

  // Form state for editing
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: ""
  });

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Fetch user profile
  useEffect(() => {
    fetchUserProfile();
    fetchUserBookings();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await userApi.getProfile();
      if (res.success && res.data.user) {
        const u = res.data.user;
        setProfile({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phone: u.phone,
          dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().slice(0, 10) : "",
          isEmailVerified: Boolean(u.isVerified),
          createdAt: u.createdAt,
        });
        setEditForm({
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone || "",
          dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().slice(0, 10) : "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchUserBookings = async () => {
    setBookingsLoading(true);
    try {
      const res = await bookingsApi.getAll();
      if (res.success && res.data.bookings) {
        const mapped = res.data.bookings.map((b: any) => ({
          id: b.id,
          serviceType: b.serviceType,
          serviceName: b.accommodation?.name || b.transportation?.name || b.tour?.name || "Service",
          status: b.status,
          startDate: b.startDate,
          endDate: b.endDate,
          totalAmount: b.totalAmount,
          participants: b.numberOfPeople,
          createdAt: b.createdAt,
        }));
        setBookings(mapped);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const res = await userApi.updateProfile(editForm);
      if (res.success && res.data.user) {
        setProfile(res.data.user);
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.clear();
      sessionStorage.clear();
      navigate("/", { replace: true });
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout Error",
        description: "Failed to logout properly",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      CONFIRMED: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      CANCELLED: { color: "bg-red-100 text-red-800", icon: XCircle },
      COMPLETED: { color: "bg-green-100 text-green-800", icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'ACCOMMODATION':
        return <MapPin className="h-4 w-4" />;
      case 'TRANSPORTATION':
        return <Clock className="h-4 w-4" />;
      case 'TOUR':
        return <Star className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gray-900">My Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your profile, bookings, and account settings
          </p>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Link to="/dashboard/accommodations">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-sm hover:shadow-md">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Home className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">Accommodations</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Find places to stay</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/dashboard/transportation">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-sm hover:shadow-md">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Car className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">Transportation</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Book transport services</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/dashboard/tours">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-sm hover:shadow-md">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Map className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">Tours</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">Explore experiences</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/dashboard/my-bookings">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-sm hover:shadow-md">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">My Bookings</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">View all bookings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-gray-100">
            <TabsTrigger 
              value="profile" 
              className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Profile</span>
              <span className="sm:hidden">Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Payments</span>
              <span className="sm:hidden">Pay</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                <CardTitle className="text-lg sm:text-xl text-gray-900">Profile Information</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => isEditing ? handleProfileUpdate() : setIsEditing(true)}
                  className="w-full sm:w-auto"
                >
                  {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-gray-100">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="bg-green-100 text-green-700">
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                      {profile.firstName} {profile.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{profile.email}</p>
                    <Badge 
                      variant={profile.isEmailVerified ? "default" : "secondary"} 
                      className={`mt-2 ${profile.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                    >
                      {profile.isEmailVerified ? "✓ Email Verified" : "⚠ Email Not Verified"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                    <Input
                      id="firstName"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      disabled={!isEditing}
                      className={`mt-1 ${!isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                    <Input
                      id="lastName"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      disabled={!isEditing}
                      className={`mt-1 ${!isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                      className="mt-1 bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="+250 788 123 456"
                      className={`mt-1 ${!isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={editForm.dateOfBirth}
                      onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                      disabled={!isEditing}
                      className={`mt-1 ${!isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Member Since</Label>
                    <Input
                      value={new Date(profile.createdAt).toLocaleDateString()}
                      disabled
                      className="mt-1 bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                    <Button 
                      onClick={handleProfileUpdate} 
                      disabled={loading} 
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)} 
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-gray-900">Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 sm:py-12">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
                    <CreditCard className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">Payment history will be available soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-gray-900">Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-gray-900">Change Password</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Update your account password</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">Change</Button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-gray-900">Email Notifications</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Manage your email preferences</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">Manage</Button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="font-semibold text-red-600 text-sm sm:text-base">Delete Account</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Permanently delete your account</p>
                  </div>
                  <Button variant="destructive" size="sm" className="w-full sm:w-auto">Delete</Button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-gray-900">Logout</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Sign out of your account</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleLogout} 
                    className="w-full sm:w-auto"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;