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
import Blog from "./pages/Blog";
import Explore from "./pages/Explore";
import AccommodationDetails from "./pages/AccommodationDetails";
import Transportation from "./pages/Transportation";
import Tours from "./pages/Tours";
import TourDetails from "./pages/TourDetails";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import VerifyEmail from "./pages/VerifyEmail";
import ProtectedRoute from "./components/ProtectedRoute";
import WhatsAppSupport from "./components/WhatsAppSupport";
import { AuthProvider } from "./hooks/useAuth";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/airport-pickup" element={<AirportPickup />} />
            <Route path="/local-experiences" element={<LocalExperiences />} />
            <Route path="/trip-planner" element={<TripPlanner />} />
            <Route path="/booking-summary" element={<BookingSummary />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/explore" element={<Explore />} />
            
            {/* Protected Routes */}
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
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
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
