import DashboardLayout from '@/components/DashboardLayout';
import AirportPickup from '@/pages/AirportPickup';

export default function AirportPickupDashboard() {
  return (
    <DashboardLayout title="Airport Pickup">
      <AirportPickup showLayout={false} />
    </DashboardLayout>
  );
}

