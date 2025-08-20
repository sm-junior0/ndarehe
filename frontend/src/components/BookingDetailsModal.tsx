import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, MapPin, Users, Clock, Star, CreditCard, Check, X, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Booking } from "@/types/types";

interface BookingDetailsModalProps {
  booking: Booking | null;
  onClose: () => void;
}

const BookingDetailsModal = ({ booking, onClose }: BookingDetailsModalProps) => {
  if (!booking) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusVariant = () => {
    switch (booking.status) {
      case "CONFIRMED":
        return "default";
      case "PENDING":
        return "outline";
      case "CANCELLED":
        return "destructive";
      default:
        return "default";
    }
  };

  const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <div className="bg-white shadow-sm rounded-xl p-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-blue-50 p-1.5 rounded-lg">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        <h4 className="font-semibold text-gray-800">{title}</h4>
      </div>
      {children}
    </div>
  );

  return (
    <Dialog open={!!booking} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 tracking-tight">
            Booking Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Booking Summary */}
          <Section icon={MapPin} title="Booking Summary">
            <h3 className="font-semibold text-lg text-gray-900">{booking.serviceName}</h3>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{booking.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-gray-500" />
                <span>
                  {booking.numberOfPeople} {booking.numberOfPeople > 1 ? "people" : "person"}
                </span>
              </div>
            </div>
          </Section>

          {/* Dates */}
          <Section icon={Calendar} title="Dates">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="font-medium text-gray-600 font-semibold">Booking Dates</p>
                <p>{formatDate(booking.startDate)}</p>
                {booking.endDate && <p>to {formatDate(booking.endDate)}</p>}
              </div>
              <div>
                <p className="font-medium text-gray-600 font-semibold">Booking Created</p>
                <p>{formatDate(booking.createdAt)}</p>
              </div>
            </div>
          </Section>

          {/* Payment */}
          <Section icon={CreditCard} title="Payment">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg font-semibold text-gray-900">
                {booking.totalAmount.toLocaleString()} {booking.currency}
              </span>
              <Badge variant={getStatusVariant()} className="ml-2">
                {booking.status === "CONFIRMED" && <Check className="h-3 w-3 mr-1" />}
                {booking.status === "CANCELLED" && <X className="h-3 w-3 mr-1" />}
                {booking.status}
              </Badge>
            </div>
          </Section>

          {/* Special Requests */}
          <Section icon={StickyNote} title="Special Requests">
            <p className="text-sm text-gray-600">
              {booking.specialRequests || "No special requests"}
            </p>
          </Section>

          {/* Accommodation Details */}
          {booking.serviceType === "ACCOMMODATION" && booking.accommodation && (
            <Section icon={Star} title="Accommodation Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>{" "}
                  <span className="font-medium font-semibold">{booking.accommodation.type}</span>
                </div>
                {booking.accommodation.category && (
                  <div>
                    <span className="text-gray-500">Category:</span>{" "}
                    <span className="font-medium">{booking.accommodation.category}</span>
                  </div>
                )}
                {booking.accommodation.rating && (
                  <div className="flex items-center">
                    <span className="text-gray-500">Rating:</span>
                    <span className="ml-2 flex items-center font-medium text-gray-700">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      {booking.accommodation.rating}
                    </span>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            {booking.status === "PENDING" && (
              <Button variant="destructive" className="px-6 hover:opacity-90 transition">
                Cancel Booking
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="px-6 hover:bg-green-400 transition">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetailsModal;
