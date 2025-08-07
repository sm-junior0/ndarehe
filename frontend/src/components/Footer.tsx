import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-white to-green-50 border-t border-green-200">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src="/favicon.png"
                  alt="NDAREHE"
                  className="h-12 w-auto"
                />
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-lg"></div>
              </div>
              {/* <span className="font-bold text-xl bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                NDAREHE
              </span> */}
            </div>
            <p className="text-sm text-muted-foreground">
              Where to stay in Rwanda 🇷🇼
            </p>
            <p className="text-sm text-muted-foreground">
              Your gateway to authentic Rwandan accommodation and local experiences.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/accommodations" className="text-muted-foreground hover:text-primary transition-colors">
                  Accommodations
                </Link>
              </li>
              <li>
                <Link to="/airport-pickup" className="text-muted-foreground hover:text-primary transition-colors">
                  Airport Pickup
                </Link>
              </li>
              <li>
                <Link to="/local-experiences" className="text-muted-foreground hover:text-primary transition-colors">
                  Local Experiences
                </Link>
              </li>
              <li>
                <Link to="/trip-planner" className="text-muted-foreground hover:text-primary transition-colors">
                  Trip Planner
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/legal" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms & Privacy
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>info@ndarehe.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+250 788 123 456</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Kigali, Rwanda</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 NDAREHE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;