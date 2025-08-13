import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "@/components/AdminDashboard";

const Admin = () => {
  const { user } = useAuth();

  // This component is now protected by RoleBasedRoute, so user will always be an admin
  return <AdminDashboard />;
};

export default Admin;