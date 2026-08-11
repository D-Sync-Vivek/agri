import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  LayoutDashboard,
  Router,
  Microchip,
  Users,
  UserCircle,
  Brain,
  BarChart3,
  LineChart,
  MessageSquare,
  X,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium transition ${
      isActive
        ? "bg-white/20 text-white"
        : "text-white/80 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-brand-600 shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <img
            src="/logo1.png"
            alt="GridSphere Logo"
            width={150}
            className="filter brightness-0 invert"
          />
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition text-white"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex flex-col p-3 gap-1">
          {!isAdmin ? (
            <>
              <NavLink to="/" end className={linkClass} onClick={onClose}>
                <Home size={20} />
                Home
              </NavLink>
              <NavLink to="/advisory" className={linkClass} onClick={onClose}>
                <Brain size={20} />
                Advisory
              </NavLink>
              <NavLink to="/insights" className={linkClass} onClick={onClose}>
                <BarChart3 size={20} />
                Insights
              </NavLink>
              <NavLink to="/analytics" className={linkClass} onClick={onClose}>
                <LineChart size={20} />
                Analytics
              </NavLink>
              <NavLink to="/chat" className={linkClass} onClick={onClose}>
                <MessageSquare size={20} />
                Chat
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/admin" end className={linkClass} onClick={onClose}>
                <LayoutDashboard size={20} />
                Overview
              </NavLink>
              <NavLink to="/devices" className={linkClass} onClick={onClose}>
                <Router size={20} />
                Devices
              </NavLink>
              <NavLink to="/admin/sensors" className={linkClass} onClick={onClose}>
                <Microchip size={20} />
                Sensors
              </NavLink>
              <NavLink to="/admin/users" className={linkClass} onClick={onClose}>
                <Users size={20} />
                Users
              </NavLink>
            </>
          )}
          <div className="border-t border-white/20 my-2" />
          <NavLink to="/profile" className={linkClass} onClick={onClose}>
            <UserCircle size={20} />
            Profile
          </NavLink>
        </nav>
      </div>
    </>
  );
}