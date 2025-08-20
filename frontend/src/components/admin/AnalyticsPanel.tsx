import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, BarChart3, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";

interface AnalyticsData {
  period: string;
  dateRange: { start: string; end: string };
  bookings: {
    trend: Array<{ label: string; bookings: number }>;
    total: number;
  };
  revenue: {
    trend: Array<{ label: string; revenue: number }>;
    total: number;
    average: number;
  };
  services: {
    split: Array<{ name: string; value: number }>;
    top: Array<{ serviceType: string; bookings: number }>;
  };
  users: {
    growth: Array<{ label: string; users: number }>;
    total: number;
  };
  metrics: {
    conversionRate: number;
    averageBookingValue: number;
    topService: string;
  };
}

const AnalyticsPanel: React.FC = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const colors = ['#16a34a', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token, period]);

  const fetchAnalytics = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await adminApi.getAnalytics(token, period);
      if (response.data.success) {
        setAnalyticsData(response.data.data);
      } else {
        toast({
          title: 'Error',
          description: response.data.error || 'Failed to fetch analytics data',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to fetch analytics data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Real-time KPIs and trends for bookings, revenue and services</p>
        </div>
        <div className="flex gap-2 text-sm">
          {(['7d', '30d', '90d'] as const).map(p => (
            <button 
              key={p} 
              onClick={() => setPeriod(p)} 
              className={`px-3 py-1.5 rounded border transition-colors ${
                period === p 
                  ? 'bg-green-600 text-white border-green-600' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.bookings.total}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">RWF {analyticsData.revenue.total.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Users</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.users.total}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Booking Value</p>
                <p className="text-2xl font-bold text-gray-900">RWF {analyticsData.metrics.averageBookingValue.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Bookings Trend</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.bookings.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke="#16a34a" 
                  strokeWidth={2} 
                  dot={false} 
                  name="Bookings"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Revenue Split</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={analyticsData.services.split} 
                  dataKey="value" 
                  nameKey="name" 
                  innerRadius={50} 
                  outerRadius={70} 
                  paddingAngle={2}
                >
                  {analyticsData.services.split.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (RWF)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.revenue.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#16a34a" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.users.growth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#8b5cf6" 
                  strokeWidth={2} 
                  dot={false} 
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Metrics and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Conversion Rate</span>
                <span className="font-semibold text-green-600">{analyticsData.metrics.conversionRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Booking Value</span>
                <span className="font-semibold">RWF {analyticsData.metrics.averageBookingValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Top Performing Service</span>
                <span className="font-semibold">{analyticsData.metrics.topService}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Period</span>
                <span className="font-semibold">{period.toUpperCase()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.services.top.map((service, index) => (
                <div key={service.serviceType} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3`} style={{ backgroundColor: colors[index % colors.length] }}></div>
                    <span className="text-sm text-gray-600 capitalize">{service.serviceType.toLowerCase()}</span>
                  </div>
                  <span className="font-semibold">{service.bookings} bookings</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Range Info */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-500 text-center">
            Data range: {new Date(analyticsData.dateRange.start).toLocaleDateString()} - {new Date(analyticsData.dateRange.end).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPanel;


