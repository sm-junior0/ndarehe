import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  Bell, Cog, Hotel, Car, Plane, MapPin, BookOpen, LayoutDashboard, Menu 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { userApi } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  title: string;
  children: React.ReactNode;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/accommodations', label: 'Accommodations', icon: Hotel },
  { to: '/dashboard/transportation', label: 'Transportation', icon: Car },
  { to: '/dashboard/airport-pickup', label: 'Airport Pickup', icon: Plane },
  { to: '/dashboard/tours', label: 'Experiences', icon: MapPin },
];

export default function DashboardLayout({ title, children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadCount = async () => {
      try {
        const res = await userApi.getUnreadNotificationsCount();
        if (res.success) setUnreadCount(res.data.count);
      } catch {}
    };
    loadCount();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.clear();
      sessionStorage.clear();
      navigate("/", { replace: true });
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "Failed to logout properly",
        variant: "destructive",
      });
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="relative">
            <img
              src="/favicon.png"
              alt="NDAREHE"
              className="h-10 w-auto transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={() => isMobile && setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-green-100 text-green-700 border-r-2 border-green-500' 
                  : 'hover:bg-green-50 text-gray-700 hover:text-green-700'
              }`
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Profile */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={(user as any)?.profileImage || ''} />
            <AvatarFallback className="text-xs">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex items-center space-x-2">
            <img src="/favicon.png" alt="NDAREHE" className="h-8 w-auto" />
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/dashboard/notifications" className="relative p-2 hover:text-green-700">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 rounded-full bg-red-500 text-white text-[10px] px-1.5 py-0.5">
                {Math.min(unreadCount, 99)}
              </span>
            )}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={(user as any)?.profileImage || ''} />
                  <AvatarFallback className="text-xs">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{user?.firstName} {user?.lastName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-[260px_1fr] lg:grid-rows-[64px_1fr] min-h-screen">
        {/* Sidebar */}
        <aside className="row-span-2 col-start-1 bg-white border-r shadow-sm">
          <SidebarContent />
        </aside>

        {/* Header */}
        <header className="col-start-2 h-16 border-b bg-white flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <div className="flex items-center space-x-4">
            <Link to="/dashboard/settings" className="p-2 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors">
              <Cog className="h-5 w-5" />
            </Link>
            <Link to="/dashboard/notifications" className="relative p-2 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 rounded-full bg-red-500 text-white text-[10px] px-1.5 py-0.5">
                  {Math.min(unreadCount, 99)}
                </span>
              )}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(user as any)?.profileImage || ''} />
                    <AvatarFallback>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user?.firstName} {user?.lastName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main */}
        <main className="col-start-2 p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>

      {/* Mobile Main */}
      <main className="lg:hidden p-4 bg-gray-50 min-h-[calc(100vh-64px)]">
        {children}
      </main>
    </div>
  );
}
