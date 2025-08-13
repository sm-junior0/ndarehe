import DashboardLayout from '@/components/DashboardLayout';
import MyBookings from '@/pages/MyBookings';

export default function MyBookingsDashboard() {
  return (
    <DashboardLayout title="My Bookings">
      <MyBookings showLayout={false} />
    </DashboardLayout>
  );
}

