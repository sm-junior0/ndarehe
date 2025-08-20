import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Clock, Star, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { bookingsApi } from "@/lib/api";
import BookingDetailsModal from "@/components/BookingDetailsModal";
import { Booking } from "@/types/types";



const MyBookings = ({ showLayout = true }: { showLayout?: boolean }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        if (!user) return;

        const response = await bookingsApi.getAll();

        if (response.success) {
          const formattedBookings = response.data.bookings.map((booking: any) => ({
            id: booking.id,
            serviceType: booking.serviceType,
            serviceName: getServiceName(booking),
            startDate: booking.startDate,
            endDate: booking.endDate,
            numberOfPeople: booking.numberOfPeople,
            totalAmount: booking.totalAmount,
            currency: booking.currency,
            status: booking.status,
            isConfirmed: booking.status === 'CONFIRMED',
            isCancelled: booking.status === 'CANCELLED',
            createdAt: booking.createdAt,
            location: getLocation(booking),
            image: getImage(booking),
            ...booking
          }));

          setBookings(formattedBookings);
        }
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const getServiceName = (booking: any): string => {
    if (booking.accommodation) return booking.accommodation.name;
    if (booking.transportation) return booking.transportation.name;
    if (booking.tour) return booking.tour.name;
    return "Unknown Service";
  };

  const getLocation = (booking: any): string => {
    if (booking.accommodation?.location) return booking.accommodation.location.city;
    if (booking.transportation?.location) return booking.transportation.location.city;
    if (booking.tour?.location) return booking.tour.location.city;
    return "Unknown Location";
  };

  const getImage = (booking: any): string => {
    if (booking.accommodation?.images?.length) return booking.accommodation.images[0];
    if (booking.transportation?.images?.length) return booking.transportation.images[0];
    if (booking.tour?.images?.length) return booking.tour.images[0];
    return "/placeholder.svg";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'ACCOMMODATION':
        return '🏨';
      case 'TOUR':
        return '🗺️';
      case 'TRANSPORTATION':
        return '🚗';
      default:
        return '📋';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {showLayout && <Header />}
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        {showLayout && <Footer />}
      </div>
    );
  }

  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
  const pendingBookings = bookings.filter(b => b.status === 'PENDING');
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');

  return (
    <div className="min-h-screen bg-background">
      {showLayout && <Header />}

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">My Bookings</h1>
          <p className="text-muted-foreground">Manage and track all your bookings</p>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed ({confirmedBookings.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingBookings.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedBookings.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelledBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onViewDetails={() => setSelectedBooking(booking)}
              />
            ))}
          </TabsContent>

          <TabsContent value="confirmed" className="space-y-4">
            {confirmedBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onViewDetails={() => setSelectedBooking(booking)}
              />
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onViewDetails={() => setSelectedBooking(booking)}
              />
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onViewDetails={() => setSelectedBooking(booking)}
              />
            ))}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {cancelledBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onViewDetails={() => setSelectedBooking(booking)}
              />
            ))}
          </TabsContent>
        </Tabs>

        {bookings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">You haven't made any bookings yet.</p>
            <Button asChild>
              <Link to="/accommodations">Start Booking</Link>
            </Button>
          </div>
        )}

        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      </main>

      {showLayout && <Footer />}
    </div>
  );
};

interface BookingCardProps {
  booking: Booking;
  onViewDetails: () => void;
}

const BookingCard = ({ booking, onViewDetails }: BookingCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'ACCOMMODATION':
        return '🏨';
      case 'TOUR':
        return '🗺️';
      case 'TRANSPORTATION':
        return '🚗';
      default:
        return '📋';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-48 h-32 md:h-auto">
          <img
            src={booking.image}
            alt={booking.serviceName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getServiceTypeIcon(booking.serviceType)}</span>
                <h3 className="text-xl font-semibold">{booking.serviceName}</h3>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{booking.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{booking.numberOfPeople} people</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(booking.status)}
              <div className="text-2xl font-bold mt-2">
                {booking.totalAmount.toLocaleString()} {booking.currency}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Booked: {formatDate(booking.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Date: {formatDate(booking.startDate)}</span>
              {booking.endDate && <span> - {formatDate(booking.endDate)}</span>}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              View Details
            </Button>
            {booking.status === 'PENDING' && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await bookingsApi.cancel(booking.id);
                    // Update local state or refresh data
                  } catch (error) {
                    console.error("Failed to cancel booking:", error);
                  }
                }}
              >
                Cancel Booking
              </Button>
            )}
            {booking.status === 'COMPLETED' && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/review/${booking.id}`}>
                  Write Review
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
export default MyBookings; 