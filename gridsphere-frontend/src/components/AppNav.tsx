import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Router,
  Microchip,
  Users,
  UserCircle,
  LogOut,
  Home,
  Brain,
  BarChart3,
  LineChart,
  MessageSquare,
} from "lucide-react";

export default function AppNav() {
  const { token, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!token) return null;
  if (location.pathname === "/login" || location.pathname === "/register") return null;

  const isAdmin = user?.role === "admin";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1 p-2 rounded-xl text-[11px] font-medium tracking-wide transition-all duration-150 ease-in-out group ${isActive
      ? "bg-white/20 text-white"
      : "text-white/70 hover:text-white hover:bg-white/10"
    }`;

  const navItems = isAdmin
    ? [
      { to: "/admin", icon: LayoutDashboard, label: "Overview" },
      { to: "/devices", icon: Router, label: "Devices" },
      { to: "/admin/sensors", icon: Microchip, label: "Sensors" },
      { to: "/admin/users", icon: Users, label: "Users" },
      { to: "/admin/compare", icon: BarChart3, label: "Compare" },
    ]
    : [
      { to: "/", icon: Home, label: "Home" },
      { to: "/advisory", icon: Brain, label: "Advisory" },
      { to: "/insights", icon: BarChart3, label: "Insights" },
      { to: "/analytics", icon: LineChart, label: "Analytics" },
      { to: "/chat", icon: MessageSquare, label: "Chat" },
    ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      aria-label="Main navigation"
      className="hidden md:flex fixed left-0 top-0 h-full w-22 flex-col items-center py-8 z-50 bg-brand-600 text-white shadow-sm overflow-y-auto"
    >
      <div className="flex flex-col justify-center items-center gap-0 pb-4">
        <img src="/favicon.svg" alt="logo" className="w-10 mb-4" />
        <span className="text-xs">AgriSense</span>
      </div>

      {/* Navigation - icons with labels below */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end className={linkClass}>
            <item.icon size={20} />
            <span className="text-center leading-tight">{item.label}</span>
          </NavLink>
        ))}
        <NavLink to="/profile" className={linkClass}>
          <UserCircle size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>

      {/* Logout - at bottom */}
      <div className="px-2 pb-4 border-t border-white/10 pt-4">
        <button
          onClick={handleLogout}
          className="flex flex-col items-center w-full py-3 px-2 rounded-lg text-xs font-medium text-white/80 hover:bg-[#2E8B57] hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}