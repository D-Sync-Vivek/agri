import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import Home from "../pages/Home";

export default function HomeOrRedirect() {
  const { user } = useAuth();
  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  return <Home />;
}