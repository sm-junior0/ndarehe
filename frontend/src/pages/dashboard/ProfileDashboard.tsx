import DashboardLayout from '@/components/DashboardLayout';
import Profile from '@/pages/Profile';

export default function ProfileDashboard() {
  return (
    <DashboardLayout title="Profile">
      <Profile showLayout={false} />
    </DashboardLayout>
  );
}

