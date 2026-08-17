import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles = ["user", "admin"] }: Props) {
  const { token, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="text-center text-ink-dim py-12">Loading console…</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

