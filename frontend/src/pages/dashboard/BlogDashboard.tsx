import DashboardLayout from '@/components/DashboardLayout';
import Blog from '@/pages/Blog';

export default function BlogDashboard() {
  return (
    <DashboardLayout title="Blog">
      <Blog showLayout={false} />
    </DashboardLayout>
  );
}

