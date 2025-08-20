import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Accommodations from "./pages/Accommodations";
import AirportPickup from "./pages/AirportPickup";
import LocalExperiences from "./pages/LocalExperiences";
import TripPlanner from "./pages/TripPlanner";
import BookingSummary from "./pages/BookingSummary";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import AccommodationsDashboard from "./pages/dashboard/AccommodationsDashboard";
import TransportationDashboard from "./pages/dashboard/TransportationDashboard";
import AirportPickupDashboard from "./pages/dashboard/AirportPickupDashboard";
import ToursDashboard from "./pages/dashboard/ToursDashboard";
import Blog from "./pages/Blog";
import BlogDashboard from "./pages/dashboard/BlogDashboard";
import MyBookingsDashboard from "./pages/dashboard/MyBookingsDashboard";
import Explore from "./pages/Explore";
import AccommodationDetails from "./pages/AccommodationDetails";
import Transportation from "./pages/Transportation";
import Tours from "./pages/Tours";
import TourDetails from "./pages/TourDetails";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import ProfileDashboard from "./pages/dashboard/ProfileDashboard";
import VerifyEmail from "./pages/VerifyEmail";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import RootRouteHandler from "./components/RootRouteHandler";
import WhatsAppSupport from "./components/WhatsAppSupport";
import { AuthProvider } from "./hooks/useAuth";
import { Toaster } from "./components/ui/toaster";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "./hooks/useAuth";
import { Navigate } from "react-router-dom";

function App() {
  const { user } = useAuth();
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Root route with role-based redirect for authenticated users */}
            <Route path="/" element={
              <>
                <RootRouteHandler />
                <Index />
              </>
            } />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/airport-pickup" element={<AirportPickup />} />
            <Route path="/local-experiences" element={<LocalExperiences />} />
            <Route path="/trip-planner" element={<TripPlanner />} />
            <Route path="/booking-summary" element={<BookingSummary />} />

            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={["USER"]}>
                  <UserDashboard />
                </RoleBasedRoute>
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={["ADMIN"]}>
                  <Admin />
                </RoleBasedRoute>
              </ProtectedRoute>
            } />

            <Route path="/provider-dashboard" element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={["PROVIDER"]}>
                  <ProviderDashboard />
                </RoleBasedRoute>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/accommodations" element={<ProtectedRoute><AccommodationsDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/transportation" element={<ProtectedRoute><TransportationDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/airport-pickup" element={<ProtectedRoute><AirportPickupDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/tours" element={<ProtectedRoute><ToursDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/blog" element={<ProtectedRoute><BlogDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/my-bookings" element={<ProtectedRoute><MyBookingsDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/notifications" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/accommodations/:id" element={
              <DashboardLayout title="Accommodation Details">
                <AccommodationDetails />
              </DashboardLayout>} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/explore" element={<Explore />} />

            {/* Protected Routes */}
            <Route path="/blog" element={<Blog />} />
            <Route path="/explore" element={<Explore />} />

            {/* Protected dashboard sub-routes */}
            <Route path="/dashboard/accommodations" element={
              <RoleBasedRoute allowedRoles={["USER"]}>
                <AccommodationsDashboard />
              </RoleBasedRoute>
            } />
            <Route path="/dashboard/transportation" element={
              <RoleBasedRoute allowedRoles={["USER"]}>
                <TransportationDashboard />
              </RoleBasedRoute>
            } />
            <Route path="/dashboard/airport-pickup" element={
              <RoleBasedRoute allowedRoles={["USER"]}>
                <AirportPickupDashboard />
              </RoleBasedRoute>
            } />
            <Route path="/dashboard/tours" element={
              <RoleBasedRoute allowedRoles={["USER"]}>
                <ToursDashboard />
              </RoleBasedRoute>
            } />
            <Route path="/dashboard/blog" element={
              <RoleBasedRoute allowedRoles={["USER"]}>
                <BlogDashboard />
              </RoleBasedRoute>
            } />
            <Route path="/dashboard/my-bookings" element={
              <RoleBasedRoute allowedRoles={["USER"]}>
                <MyBookingsDashboard />
              </RoleBasedRoute>
            } />
            <Route path="/dashboard/profile" element={
              <RoleBasedRoute allowedRoles={["USER"]}>
                <ProfileDashboard />
              </RoleBasedRoute>
            } />

            {/* Protected service routes */}
            <Route path="/accommodations" element={
              <ProtectedRoute>
                <Accommodations />
              </ProtectedRoute>
            } />
            <Route path="/accommodation/:id" element={
              <ProtectedRoute>
                <AccommodationDetails />
              </ProtectedRoute>
            } />
            <Route path="/transportation" element={
              <ProtectedRoute>
                <Transportation />
              </ProtectedRoute>
            } />
            <Route path="/tours" element={
              <ProtectedRoute>
                <Tours />
              </ProtectedRoute>
            } />
            <Route path="/tour/:id" element={
              <ProtectedRoute>
                <TourDetails />
              </ProtectedRoute>
            } />
            <Route path="/my-bookings" element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            } />
          </Routes>

          {/* Global WhatsApp Support */}
          <WhatsAppSupport />

          {/* Global Toaster */}
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
