import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, TrendingUp, Users, Calendar, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, LineChart, Line, ResponsiveContainer, Tooltip, Legend } from "recharts";

type ReportRow = { 
  date: string; 
  bookings?: number; 
  revenue?: number;
  totalBookings?: number;
  confirmedBookings?: number;
  cancelledBookings?: number;
  pendingBookings?: number;
  totalActivities?: number;
  userRegistrations?: number;
  payments?: number;
  contentCreations?: number;
};

type ReportType = 'revenue' | 'bookings' | 'activity';

const ReportsPanel: React.FC = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [reportType, setReportType] = useState<ReportType>('revenue');
  const [groupBy, setGroupBy] = useState<string>('day');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [generated, setGenerated] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const totals = useMemo(() => {
    if (!data.length) return { totalBookings: 0, totalRevenue: 0, avgValue: 0 };
    
    const totalBookings = data.reduce((s, d) => s + (d.bookings || d.totalBookings || 0), 0);
    const totalRevenue = data.reduce((s, d) => s + (d.revenue || 0), 0);
    const avgValue = totalBookings ? Math.round(totalRevenue / totalBookings) : 0;
    return { totalBookings, totalRevenue, avgValue };
  }, [data]);

  const generateReport = async () => {
    if (!dateFrom || !dateTo || !token) {
      toast({
        title: 'Error',
        description: 'Please select date range and ensure you are logged in',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const start = new Date(dateFrom);
      const end = new Date(dateTo);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        toast({
          title: 'Error',
          description: 'Invalid date range',
          variant: 'destructive'
        });
        setData([]);
        setGenerated(false);
        return;
      }

      let response;
      switch (reportType) {
        case 'revenue':
          response = await adminApi.getRevenueReport(token, { startDate: dateFrom, endDate: dateTo, groupBy });
          break;
        case 'bookings':
          response = await adminApi.getBookingsReport(token, { startDate: dateFrom, endDate: dateTo, groupBy });
          break;
        case 'activity':
          response = await adminApi.getActivityReport(token, { startDate: dateFrom, endDate: dateTo, groupBy });
          break;
        default:
          throw new Error('Invalid report type');
      }

      if (response.data.success) {
        const reportData = response.data.data.report;
        
        if (reportData && reportData.length > 0) {
          setData(reportData);
          setSummary(response.data.data.summary);
          setGenerated(true);
          toast({
            title: 'Success',
            description: 'Report generated successfully',
          });
        } else {
          // Handle case where no data exists for the selected date range
          setData([]);
          setSummary(null);
          setGenerated(false);
          toast({
            title: 'No Data',
            description: 'No data found for the selected date range. Try selecting a different period or check if data exists in the system.',
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Error',
          description: response.data.error || 'Failed to generate report',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to generate report',
        variant: 'destructive'
      });
      setData([]);
      setSummary(null);
      setGenerated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generated || data.length === 0) {
      toast({
        title: 'Error',
        description: 'No report data to download',
        variant: 'destructive'
      });
      return;
    }

    setDownloading(true);
    try {
      let headers: string[];
      let rows: string[];

      switch (reportType) {
        case 'revenue':
          headers = ['Date', 'Revenue', 'Bookings'];
          rows = data.map(r => `${r.date},${r.revenue || 0},${r.bookings || 0}`);
          break;
        case 'bookings':
          headers = ['Date', 'Total Bookings', 'Confirmed', 'Cancelled', 'Pending', 'Revenue'];
          rows = data.map(r => `${r.date},${r.totalBookings || 0},${r.confirmedBookings || 0},${r.cancelledBookings || 0},${r.pendingBookings || 0},${r.revenue || 0}`);
          break;
        case 'activity':
          headers = ['Date', 'Total Activities', 'User Registrations', 'Bookings', 'Payments', 'Content Creations'];
          rows = data.map(r => `${r.date},${r.totalActivities || 0},${r.userRegistrations || 0},${r.bookings || 0},${r.payments || 0},${r.contentCreations || 0}`);
          break;
        default:
          throw new Error('Invalid report type');
      }

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${dateFrom}_${dateTo}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Report downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: 'Error',
        description: 'Failed to download report',
        variant: 'destructive'
      });
    } finally {
      setDownloading(false);
    }
  };

  const getChartData = () => {
    return data.map(item => ({
      date: item.date,
      ...(reportType === 'revenue' && {
        revenue: item.revenue || 0,
        bookings: item.bookings || 0
      }),
      ...(reportType === 'bookings' && {
        total: item.totalBookings || 0,
        confirmed: item.confirmedBookings || 0,
        cancelled: item.cancelledBookings || 0,
        pending: item.pendingBookings || 0
      }),
      ...(reportType === 'activity' && {
        total: item.totalActivities || 0,
        registrations: item.userRegistrations || 0,
        bookings: item.bookings || 0,
        payments: item.payments || 0,
        content: item.contentCreations || 0
      })
    }));
  };

  const getSummaryCards = () => {
    if (!summary) return [];

    switch (reportType) {
      case 'revenue':
        return [
          { title: 'Total Revenue', value: `RWF ${summary.totalRevenue?.toLocaleString() || 0}`, icon: TrendingUp, color: 'text-green-600' },
          { title: 'Total Bookings', value: summary.totalBookings || 0, icon: Calendar, color: 'text-blue-600' },
          { title: 'Average Revenue', value: `RWF ${Math.round(summary.averageRevenue || 0).toLocaleString()}`, icon: BarChart3, color: 'text-purple-600' }
        ];
      case 'bookings':
        return [
          { title: 'Total Bookings', value: summary.totalBookings || 0, icon: Calendar, color: 'text-blue-600' },
          { title: 'Confirmed', value: summary.confirmedBookings || 0, icon: TrendingUp, color: 'text-green-600' },
          { title: 'Cancelled', value: summary.cancelledBookings || 0, icon: BarChart3, color: 'text-red-600' },
          { title: 'Pending', value: summary.pendingBookings || 0, icon: BarChart3, color: 'text-yellow-600' }
        ];
      case 'activity':
        return [
          { title: 'Total Activities', value: summary.totalActivities || 0, icon: Activity, color: 'text-blue-600' },
          { title: 'User Registrations', value: summary.userRegistrations || 0, icon: Users, color: 'text-green-600' },
          { title: 'Bookings', value: summary.bookings || 0, icon: Calendar, color: 'text-purple-600' },
          { title: 'Content Created', value: summary.contentCreations || 0, icon: BarChart3, color: 'text-orange-600' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <p className="text-gray-600">Export revenue, bookings and activity reports by date range</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleDownload} 
          disabled={downloading || !generated || data.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          {downloading ? 'Downloading...' : 'Download CSV'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue Report</SelectItem>
                  <SelectItem value="bookings">Bookings Report</SelectItem>
                  <SelectItem value="activity">Activity Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={generateReport} disabled={loading || !dateFrom || !dateTo}>
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {getSummaryCards().map((card, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                  <card.icon className={`h-8 w-8 ${card.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Initial State Message */}
      {!generated && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Your First Report</h3>
            <p className="text-gray-500 mb-4">
              To get started with reports, select a report type, choose your date range, and click "Generate Report".
            </p>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Available Report Types:</strong></p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• <strong>Revenue Report:</strong> Track income and booking trends over time</li>
                <li>• <strong>Bookings Report:</strong> Monitor booking statuses and patterns</li>
                <li>• <strong>Activity Report:</strong> View platform usage and user engagement</li>
              </ul>
              <p className="mt-4"><strong>Grouping Options:</strong> Day, Week, or Month views for different analysis needs</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data Message */}
      {generated && data.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-500 mb-4">
              No data found for the selected date range and report type. This could mean:
            </p>
            <ul className="text-sm text-gray-500 space-y-1 mb-6">
              <li>• No activities occurred during the selected period</li>
              <li>• No bookings were made in the selected date range</li>
              <li>• No payments were completed during this time</li>
              <li>• The system is new and doesn't have historical data yet</li>
            </ul>
            <div className="text-sm text-gray-600">
              <p><strong>Tip:</strong> Try selecting a different date range or check if there's data in other parts of the system.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {generated && data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                {reportType === 'revenue' && 'Revenue & Bookings'}
                {reportType === 'bookings' && 'Booking Status'}
                {reportType === 'activity' && 'Activity Overview'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {reportType === 'revenue' && (
                    <>
                      <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                      <Bar dataKey="bookings" fill="#3b82f6" name="Bookings" />
                    </>
                  )}
                  {reportType === 'bookings' && (
                    <>
                      <Bar dataKey="total" fill="#3b82f6" name="Total" />
                      <Bar dataKey="confirmed" fill="#10b981" name="Confirmed" />
                      <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" />
                      <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                    </>
                  )}
                  {reportType === 'activity' && (
                    <>
                      <Bar dataKey="total" fill="#3b82f6" name="Total Activities" />
                      <Bar dataKey="registrations" fill="#10b981" name="Registrations" />
                      <Bar dataKey="bookings" fill="#8b5cf6" name="Bookings" />
                      <Bar dataKey="content" fill="#f97316" name="Content Created" />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                {reportType === 'revenue' && 'Revenue Trend'}
                {reportType === 'bookings' && 'Bookings Trend'}
                {reportType === 'activity' && 'Activity Trend'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {reportType === 'revenue' && (
                    <>
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" />
                      <Line type="monotone" dataKey="bookings" stroke="#3b82f6" name="Bookings" />
                    </>
                  )}
                  {reportType === 'bookings' && (
                    <>
                      <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" />
                      <Line type="monotone" dataKey="confirmed" stroke="#10b981" name="Confirmed" />
                      <Line type="monotone" dataKey="cancelled" stroke="#ef4444" name="Cancelled" />
                    </>
                  )}
                  {reportType === 'activity' && (
                    <>
                      <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total Activities" />
                      <Line type="monotone" dataKey="registrations" stroke="#10b981" name="Registrations" />
                      <Line type="monotone" dataKey="bookings" stroke="#8b5cf6" name="Bookings" />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      {generated && data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Report Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    {reportType === 'revenue' && (
                      <>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">Bookings</th>
                      </>
                    )}
                    {reportType === 'bookings' && (
                      <>
                        <th className="text-right p-2">Total</th>
                        <th className="text-right p-2">Confirmed</th>
                        <th className="text-right p-2">Cancelled</th>
                        <th className="text-right p-2">Pending</th>
                        <th className="text-right p-2">Revenue</th>
                      </>
                    )}
                    {reportType === 'activity' && (
                      <>
                        <th className="text-right p-2">Total</th>
                        <th className="text-right p-2">Registrations</th>
                        <th className="text-right p-2">Bookings</th>
                        <th className="text-right p-2">Payments</th>
                        <th className="text-right p-2">Content</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">{row.date}</td>
                      {reportType === 'revenue' && (
                        <>
                          <td className="text-right p-2">RWF {(row.revenue || 0).toLocaleString()}</td>
                          <td className="text-right p-2">{row.bookings || 0}</td>
                        </>
                      )}
                      {reportType === 'bookings' && (
                        <>
                          <td className="text-right p-2">{row.totalBookings || 0}</td>
                          <td className="text-right p-2">{row.confirmedBookings || 0}</td>
                          <td className="text-right p-2">{row.cancelledBookings || 0}</td>
                          <td className="text-right p-2">{row.pendingBookings || 0}</td>
                          <td className="text-right p-2">RWF {(row.revenue || 0).toLocaleString()}</td>
                        </>
                      )}
                      {reportType === 'activity' && (
                        <>
                          <td className="text-right p-2">{row.totalActivities || 0}</td>
                          <td className="text-right p-2">{row.userRegistrations || 0}</td>
                          <td className="text-right p-2">{row.bookings || 0}</td>
                          <td className="text-right p-2">{row.payments || 0}</td>
                          <td className="text-right p-2">{row.contentCreations || 0}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsPanel;


