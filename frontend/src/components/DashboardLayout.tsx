import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bell, Cog, UserCircle2, Hotel, Car, Plane, MapPin, BookOpen, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { userApi } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  { to: '/dashboard/blog', label: 'Blog', icon: BookOpen },
];

export default function DashboardLayout({ title, children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const loadCount = async () => {
      try {
        const res = await userApi.getUnreadNotificationsCount();
        if (res.success) setUnreadCount(res.data.count);
      } catch {}
    };
    loadCount();
  }, []);

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] grid-rows-[64px_1fr]">
      {/* Sidebar */}
      <aside className="row-span-2 col-start-1 bg-white border-r">
        <div className="h-16 flex items-center px-4 border-b">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <img
                src="/favicon.png"
                alt="NDAREHE"
                className="h-10 w-auto transition-transform duration-300 group-hover:scale-110"
                style={{ border: 'none', boxShadow: 'none' }}
              />
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </Link>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-green-100 text-green-700' : 'hover:bg-green-50'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Header */}
      <header className="col-start-2 h-16 border-b bg-white flex items-center justify-between px-4">
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="flex items-center gap-4">
          <Link to="/dashboard/settings" title="Settings" className="hover:text-green-700">
            <Cog className="h-5 w-5" />
          </Link>
          <Link to="/dashboard/notifications" title="Notifications" className="relative hover:text-green-700">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 rounded-full bg-red-500 text-white text-[10px] px-1.5 py-0.5">
                {Math.min(unreadCount, 99)}
              </span>
            )}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={(user as any)?.profileImage || ''} />
                <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.firstName} {user?.lastName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main */}
      <main className="col-start-2 p-4 bg-muted/30 min-h-[calc(100vh-64px)]">{children}</main>
    </div>
  );
}


