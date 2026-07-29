import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  /**
   * Roles allowed to view the nested routes. The app has two real roles:
   * "user" (field operators) and "admin" (also manages the device/sensor
   * fleet). Most routes pass ["user", "admin"] since both should see
   * them; device/sensor management routes pass ["admin"] only (see
   * App.tsx). The backend enforces the same check server-side via
   * requireRole (see the Node API's src/middleware/rbac.ts), so this is
   * a UX guard, not the security boundary - it's what determines whether
   * a user gets redirected to /unauthorized, not whether the underlying
   * API calls would actually succeed.
   */
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles = ["user", "admin"] }: Props) {
  const { token, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-text">Loading console…</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}


