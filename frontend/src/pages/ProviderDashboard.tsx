import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Hotel, 
  Car, 
  MapPin, 
  FileText, 
  Settings, 
  Plus,
  Eye,
  Edit,
  Star,
  DollarSign,
  Calendar,
  TrendingUp,
  LogOut,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const ProviderDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const stats = {
    totalListings: 8,
    activeBookings: 12,
    totalRevenue: 245000,
    averageRating: 4.6
  };

  const recentBookings = [
    { id: 'BK001', guestName: 'John Doe', service: 'Kigali Heights Hotel', dates: 'Dec 15-17', status: 'confirmed', amount: 45000 },
    { id: 'BK002', guestName: 'Jane Smith', service: 'Airport Pickup', dates: 'Dec 14', status: 'pending', amount: 25000 },
    { id: 'BK003', guestName: 'Bob Johnson', service: 'City Tour', dates: 'Dec 13', status: 'completed', amount: 35000 }
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-800 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white">NDAREHE</h1>
          <p className="text-sm text-gray-300">Provider Portal</p>
        </div>
        
        <nav className="mt-8">
          <div className="px-6 space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'dashboard' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              Dashboard
            </button>
            
            <button
              onClick={() => setActiveTab('accommodations')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'accommodations' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Hotel className="mr-3 h-5 w-5" />
              Accommodations
            </button>
            
            <button
              onClick={() => setActiveTab('transportation')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'transportation' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Car className="mr-3 h-5 w-5" />
              Transportation
            </button>
            
            <button
              onClick={() => setActiveTab('tours')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'tours' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <MapPin className="mr-3 h-5 w-5" />
              Tours
            </button>
            
            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'bookings' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Calendar className="mr-3 h-5 w-5" />
              Bookings
            </button>
            
            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'reviews' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Star className="mr-3 h-5 w-5" />
              Reviews
            </button>
            
            <button
              onClick={() => setActiveTab('earnings')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'earnings' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <DollarSign className="mr-3 h-5 w-5" />
              Earnings
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'settings' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </button>
          </div>
          
          <div className="mt-8 px-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {activeTab === 'overview' && (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.firstName || 'Provider'}. Here's what's happening with your services.</p>
              </div>

              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Listings</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalListings}</p>
                        <p className="text-sm text-gray-500">Active services</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <Hotel className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.activeBookings}</p>
                        <p className="text-sm text-gray-500">This month</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <Calendar className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-3xl font-bold text-gray-900">RWF {stats.totalRevenue.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">This month</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <DollarSign className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Average Rating</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.averageRating}</p>
                        <p className="text-sm text-gray-500">Out of 5</p>
                      </div>
                      <div className="p-3 bg-yellow-100 rounded-full">
                        <Star className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{booking.id}</p>
                          <p className="text-sm text-gray-500">{booking.guestName}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-gray-900">{booking.service}</p>
                          <p className="text-sm text-gray-500">{booking.dates}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">RWF {booking.amount.toLocaleString()}</p>
                          <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'listings' && (
            <div className="text-center py-12">
              <Hotel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">My Listings</h3>
              <p className="text-gray-500">Manage your accommodation, transportation, and tour listings.</p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add New Listing
              </Button>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bookings Management</h3>
              <p className="text-gray-500">View and manage all bookings for your services.</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Reviews</h3>
              <p className="text-gray-500">See what your customers are saying about your services.</p>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Earnings & Analytics</h3>
              <p className="text-gray-500">Track your revenue and performance metrics.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Provider Settings</h3>
              <p className="text-gray-500">Manage your account and service settings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
