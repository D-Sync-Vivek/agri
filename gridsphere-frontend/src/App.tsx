import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DeviceProvider } from "./context/DeviceContext";
import AppHeader from "./components/AppHeader";
import AppNav from "./components/AppNav";
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
import AdvisoryPage from "./pages/AdvisoryPage";
import InsightsPage from "./pages/InsightsPage";
import ForecastPage from "./pages/ForecastPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ChatPage from "./pages/ChatPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DeviceProvider>
          <div className="app-shell">
            <AppNav />
            <AppHeader />
            <Routes>
               <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
            </Routes>
            <main className="flex-1 min-w-0 pt-16 pb-20 md:pb-6 md:pl-22">
              <Routes>
                <Route element={<ProtectedRoute allowedRoles={["user", "admin"]} />}>
                  <Route path="/" element={<HomeOrRedirect />} />
                  <Route path="/advisory" element={<AdvisoryPage />} />
                  <Route path="/insights" element={<InsightsPage />} />
                  <Route path="/forecast" element={<ForecastPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/chat" element={<ChatPage />} />
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
          </div>
        </DeviceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}