import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DeviceProvider } from "./context/DeviceContext";
import AppHeader from "./components/AppHeader";
import BottomNav from "./components/BottomNav";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import DeviceDetail from "./pages/DeviceDetail";
import SensorHistory from "./pages/SensorHistory";
import Profile from "./pages/Profile";
import Plans from "./pages/Plans";
import Unauthorized from "./pages/Unauthorized";
import AdminUsers from "./pages/AdminUsers";
import AdminDevices from "./pages/AdminDevices";
import AdminOverview from "./pages/AdminOverview";
import HomeOrRedirect from "./components/HomeOrRedirect";
import AdminSensors from "./pages/AdminSensors";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DeviceProvider>
          <div className="app-shell">
            <AppHeader />
            <main className="flex-1 w-full">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route element={<ProtectedRoute allowedRoles={["user", "admin"]} />}>
                  <Route path="/" element={<HomeOrRedirect />} />
                  <Route path="/devices/:deviceId/sensors/:sensorId/history" element={<SensorHistory />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/plans" element={<Plans />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                  <Route path="/devices" element={<Dashboard />} />
                  <Route path="/devices/:deviceId" element={<DeviceDetail />} />
                  <Route path="/admin" element={<AdminOverview />} />
                  <Route path="/admin/devices" element={<AdminDevices />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/sensors" element={<AdminSensors />} />
                </Route>
              </Routes>
            </main>
            <BottomNav />
          </div>
        </DeviceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}