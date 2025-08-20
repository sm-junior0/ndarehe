import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  User,
  Hotel,
  Car,
  MapPin,
  DollarSign
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  userId: string;
  guestName: string;
  serviceType: 'ACCOMMODATION' | 'TRANSPORTATION' | 'TOUR';
  serviceName: string;
  startDate: string;
  endDate?: string;
  numberOfPeople: number;
  totalAmount: number;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REFUNDED';
  createdAt: string;
  specialRequests?: string;
}

const BookingsManagement: React.FC = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    fetchBookings();
  }, [currentPage, statusFilter, serviceTypeFilter]);

  const fetchBookings = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage
      };
      
      if (statusFilter !== 'all') params.status = statusFilter;
      if (serviceTypeFilter !== 'all') params.serviceType = serviceTypeFilter;

      const response = await adminApi.getBookings(token, params);
      if (response.data.success) {
        const data = response.data.data;
        const list = Array.isArray(data?.bookings) ? data.bookings : [];
        
        // Map to local shape
        const shaped: Booking[] = list.map((b: any) => ({
          id: b.id,
          userId: b.userId,
          guestName: `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.trim() || b.user?.email || 'Guest',
          serviceType: b.serviceType,
          serviceName: b.accommodation?.name || b.transportation?.name || b.tour?.name || 'Service',
          startDate: b.startDate,
          endDate: b.endDate,
          numberOfPeople: b.numberOfPeople,
          totalAmount: b.totalAmount,
          currency: b.currency,
          status: b.status,
          createdAt: b.createdAt,
          specialRequests: b.specialRequests || '',
        }));
        
        setBookings(shaped);
        
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.totalItems);
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch bookings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    if (!token) return;
    
    try {
      const response = await adminApi.updateBookingStatus(token, bookingId, newStatus);
      
      if (response.data.success) {
        // Update local state
        setBookings(bookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: newStatus as any }
            : booking
        ));
        
        toast({
          title: 'Success',
          description: `Booking status updated to ${newStatus}`,
        });
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'PENDING': 'secondary',
      'CONFIRMED': 'default',
      'CANCELLED': 'destructive',
      'COMPLETED': 'default',
      'REFUNDED': 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'ACCOMMODATION':
        return <Hotel className="h-4 w-4 text-green-600" />;
      case 'TRANSPORTATION':
        return <Car className="h-4 w-4 text-green-600" />;
      case 'TOUR':
        return <MapPin className="h-4 w-4 text-purple-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const exportBookings = async () => {
    if (!token) return;
    
    try {
      // Fetch all bookings for export (without pagination)
      const response = await adminApi.getBookings(token, { limit: 1000 });
      if (response.data.success) {
        const allBookings = response.data.data.bookings || [];
        
        const csvContent = [
          ['ID', 'Guest Name', 'Service Type', 'Service Name', 'Start Date', 'End Date', 'People', 'Amount', 'Status', 'Created Date', 'Special Requests'],
          ...allBookings.map((booking: any) => [
            booking.id,
            `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`.trim() || booking.user?.email || 'Guest',
            booking.serviceType,
            booking.accommodation?.name || booking.transportation?.name || booking.tour?.name || 'Service',
            new Date(booking.startDate).toLocaleDateString(),
            booking.endDate ? new Date(booking.endDate).toLocaleDateString() : '',
            booking.numberOfPeople.toString(),
            `${booking.totalAmount} ${booking.currency}`,
            booking.status,
            new Date(booking.createdAt).toLocaleDateString(),
            booking.specialRequests || ''
          ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookings-export-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Success',
          description: 'Bookings exported successfully',
        });
      }
    } catch (error) {
      console.error('Error exporting bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to export bookings',
        variant: 'destructive'
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bookings Management</h2>
          <p className="text-gray-600">Manage all platform bookings and reservations</p>
        </div>
        <Button onClick={exportBookings}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); handleFilterChange(); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
              <Select value={serviceTypeFilter} onValueChange={(value) => { setServiceTypeFilter(value); handleFilterChange(); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="ACCOMMODATION">Accommodation</SelectItem>
                  <SelectItem value="TRANSPORTATION">Transportation</SelectItem>
                  <SelectItem value="TOUR">Tour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setServiceTypeFilter('all');
                  setCurrentPage(1);
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings ({totalItems} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Booking ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Guest</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Service</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Dates</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">People</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm">{booking.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium">{booking.guestName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {getServiceIcon(booking.serviceType)}
                        <div className="ml-2">
                          <div className="font-medium">{booking.serviceName}</div>
                          <div className="text-sm text-gray-500">{booking.serviceType}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="font-medium">{new Date(booking.startDate).toLocaleDateString()}</div>
                        {booking.endDate && (
                          <div className="text-gray-500">to {new Date(booking.endDate).toLocaleDateString()}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-medium">{booking.numberOfPeople}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                        <span className="font-bold">{booking.totalAmount.toLocaleString()}</span>
                        <span className="text-sm text-gray-500 ml-1">{booking.currency}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {booking.status === 'PENDING' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600 hover:text-green-700"
                              onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredBookings.length === 0 && !loading && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} bookings
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  disabled={currentPage <= 1} 
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  disabled={currentPage >= totalPages} 
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingsManagement;
