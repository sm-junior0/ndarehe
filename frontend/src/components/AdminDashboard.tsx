import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Calendar, 
  Users, 
  Hotel, 
  Car, 
  MapPin, 
  TrendingUp, 
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  LogOut as Logout,
  Settings
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { adminApi } from "@/lib/api";
import UsersManagement from "./admin/UsersManagement";
import AccommodationsManagement from "./admin/AccommodationsManagement";
import BookingsManagement from "./admin/BookingsManagement";
import TransportationManagement from "./admin/TransportationManagement";
import ToursManagement from "./admin/ToursManagement";
import ReportsPanel from "./admin/ReportsPanel";
import SettingsPanel from "./admin/SettingsPanel";
import AnalyticsPanel from "./admin/AnalyticsPanel";
import NotificationsPanel from "./admin/NotificationsPanel";
import HelpPanel from "./admin/HelpPanel";
import { AddNewModal, ExportReportModal } from "./admin/DashboardModals";
import { useNavigate } from "react-router-dom";

const AdminDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAccommodations: 0,
    totalTours: 0,
    totalTransportation: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    pendingTripPlans: 0,
    unverifiedAccommodations: 0,
    unverifiedTransportation: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [addNewOpen, setAddNewOpen] = useState(false);

  useEffect(() => {
    // Fetch dashboard stats and recent activity from backend
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await adminApi.getDashboard();
        if ((res as any).success) {
          const payload = (res as any).data || {};
          setStats(payload.stats || {});
        }
      } catch (err) {
        setStats({
          totalUsers: 0,
          totalAccommodations: 0,
          totalTours: 0,
          totalTransportation: 0,
          totalBookings: 0,
          totalRevenue: 0,
          pendingBookings: 0,
          pendingTripPlans: 0,
          unverifiedAccommodations: 0,
          unverifiedTransportation: 0,
        });
      }
      await loadActivity(1);
      setLoading(false);
    };
    fetchDashboard();
  }, [token]);

  // Auto-refresh activity without full page reload (polling)
  useEffect(() => {
    const interval = setInterval(() => {
      loadActivity(activityPage);
    }, 10000);
    return () => clearInterval(interval);
  }, [activityPage]);

  const loadActivity = async (page: number) => {
    try {
      const act = await adminApi.getActivity({ limit: 10, page });
      if ((act as any).success) {
        const list = (act as any).data?.activity || [];
        const meta = (act as any).data?.pagination;
        const feed = list.map((item: any) => ({
          id: item.id,
          type: item.type,
          message: item.message,
          timestamp: new Date(item.timestamp).toLocaleString(),
          priority: ['PAYMENT_FAILED'].includes(item.type) ? 'high' : ['BOOKING_CREATED','ACCOMMODATION_CREATED','TRANSPORTATION_CREATED','TOUR_CREATED','USER_REGISTERED'].includes(item.type) ? 'low' : 'medium'
        }));
        setRecentActivity(feed);
        if (meta) {
          setActivityPage(meta.page);
          setActivityTotalPages(meta.totalPages);
        }
      }
    } catch {
      setRecentActivity([]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'USER_REGISTERED':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'BOOKING_CREATED':
      case 'BOOKING_CONFIRMED':
      case 'BOOKING_UPDATED':
        return <Calendar className="h-4 w-4 text-green-600" />;
      case 'PAYMENT_COMPLETED':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'PAYMENT_FAILED':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'ACCOMMODATION_CREATED':
      case 'ACCOMMODATION_UPDATED':
      case 'TRANSPORTATION_CREATED':
      case 'TRANSPORTATION_UPDATED':
      case 'TOUR_CREATED':
      case 'TOUR_UPDATED':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'USER_STATUS_UPDATED':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'SYSTEM_SETTING_UPDATED':
        return <Settings className="h-4 w-4 text-purple-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-orange-200 bg-orange-50';
      case 'low':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-white flex font-sans">
      {/* Left Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-green-600 to-green-500 text-white shadow-lg flex flex-col">
        <div className="p-6 flex items-center space-x-3 group">
          <div className="relative">
            <img
              src="/favicon.png"
              alt="NDAREHE"
              className="h-12 w-auto transition-transform duration-300 group-hover:scale-110"
              style={{ border: 'none', boxShadow: 'none' }}
            />
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </div>
        <nav className="mt-8 flex-1">
          <div className="px-4 space-y-1">
            {[
              { tab: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { tab: 'bookings', label: 'Bookings', icon: Calendar },
              { tab: 'users', label: 'Users', icon: Users },
              { tab: 'accommodations', label: 'Accommodations', icon: Hotel },
              { tab: 'transportation', label: 'Transportation', icon: Car },
              { tab: 'tours', label: 'Tours', icon: MapPin },
              { tab: 'reports', label: 'Reports', icon: BarChart3 },
              { tab: 'settings', label: 'Settings', icon: BarChart3 },
              { tab: 'analytics', label: 'Analytics', icon: TrendingUp },
              { tab: 'help', label: 'Help', icon: Eye },
            ].map(({ tab, label, icon: Icon }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full flex items-center px-4 py-2 text-base font-medium rounded-lg transition-colors duration-150 ${
                  activeTab === tab
                    ? 'bg-white text-green-700 shadow font-semibold'
                    : 'text-white hover:bg-green-700/80'
                }`}
              >
                <span
                  className={`mr-3 h-5 w-5 flex items-center justify-center rounded-full transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-green-100 text-green-700'
                      : 'bg-green-700/30 text-white group-hover:bg-green-600/50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {label}
              </button>
            ))}
          </div>
        </nav>
        <div className="p-4 flex flex-col items-center space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-base font-medium rounded-lg bg-white text-green-700 hover:bg-green-100 transition-colors duration-150 shadow"
          >
            <Logout className="h-5 w-5 mr-2" />
            Logout
          </button>
          <span className="text-xs text-green-100 opacity-70">Admin Panel</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 bg-gray-50 min-h-screen">
        {activeTab === 'dashboard' && (
          <div className="space-y-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-extrabold text-green-700 mb-1">Admin Dashboard</h1>
                <p className="text-gray-500 text-lg">Welcome back, <span className="font-semibold">{user?.firstName}</span>!</p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50" onClick={() => setExportOpen(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setAddNewOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="bg-white rounded-xl shadow hover:shadow-lg transition">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold text-green-700">Total Users</CardTitle>
                  <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-full">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-800">{stats.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-gray-400 mt-1">+20.1% from last month</p>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-xl shadow hover:shadow-lg transition">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold text-green-700">Total Bookings</CardTitle>
                  <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-full">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-800">{stats.totalBookings.toLocaleString()}</div>
                  <p className="text-xs text-gray-400 mt-1">+12.5% from last month</p>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-xl shadow hover:shadow-lg transition">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold text-green-700">Total Revenue</CardTitle>
                  <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-800">${stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-gray-400 mt-1">+8.2% from last month</p>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-xl shadow hover:shadow-lg transition">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold text-yellow-700">Pending Bookings</CardTitle>
                  <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-800">{stats.pendingBookings}</div>
                  <p className="text-xs text-yellow-600 mt-1">Requires attention</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white rounded-xl shadow hover:shadow-lg transition">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-green-700">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center text-gray-400">Loading...</div>
                  ) : recentActivity.length === 0 ? (
                    <div className="text-center text-gray-400">No recent activity.</div>
                  ) : (
                    recentActivity.map((activity: any) => (
                      <div key={activity.id} className={`flex items-center space-x-4 p-4 rounded-lg border ${getAlertColor(activity.priority)}`}>
                        {getAlertIcon(activity.type)}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                          <p className="text-xs text-gray-400">{activity.timestamp}</p>
                        </div>
                        <Badge variant="outline" className={`text-xs capitalize ${activity.priority === 'high' ? 'border-red-400 text-red-600' : activity.priority === 'medium' ? 'border-orange-400 text-orange-600' : 'border-yellow-400 text-yellow-600'}`}>
                          {activity.priority}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <Button variant="outline" disabled={activityPage <= 1} onClick={() => loadActivity(activityPage - 1)}>Previous</Button>
                  <span className="text-sm text-gray-500">Page {activityPage} of {activityTotalPages}</span>
                  <Button variant="outline" disabled={activityPage >= activityTotalPages} onClick={() => loadActivity(activityPage + 1)}>Next</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other Tabs */}
        {activeTab === 'bookings' && <BookingsManagement />}
        {activeTab === 'users' && <UsersManagement />}
        {activeTab === 'accommodations' && <AccommodationsManagement />}
        {activeTab === 'transportation' && <TransportationManagement />}
        {activeTab === 'tours' && <ToursManagement />}
        {activeTab === 'reports' && <ReportsPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
        {activeTab === 'analytics' && <AnalyticsPanel />}
        {activeTab === 'notifications' && <NotificationsPanel />}
        {activeTab === 'help' && <HelpPanel />}
      </main>

      {/* Global modals */}
      <ExportReportModal open={exportOpen} onOpenChange={setExportOpen} />
      <AddNewModal open={addNewOpen} onOpenChange={setAddNewOpen} />
    </div>
  );
};

export default AdminDashboard;
