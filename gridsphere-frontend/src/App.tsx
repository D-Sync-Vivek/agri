import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DeviceProvider } from "./context/DeviceContext";
import AppHeader from "./components/AppHeader";
import AppNav from "./components/AppNav";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
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
import AnalyticsPage from "./pages/AnalyticsPage";
import ChatPage from "./pages/ChatPage";
import InsigthsForecast from "./components/InsightsForecast";
import AdminCompare from "./pages/AdminCompare";
import CompareDetail from "./pages/CompareDetail";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <AppNav />
      <AppHeader />
      <main className="flex-1 min-w-0 pt-16 md:pb-6 md:pl-22">
        {children}
      </main>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      {isAuthPage ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route element={<ProtectedRoute allowedRoles={["user", "admin"]} />}>
              <Route path="/" element={<HomeOrRedirect />} />
              <Route path="/advisory" element={<AdvisoryPage />} />
              <Route path="/insights" element={<InsigthsForecast />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route
                path="/devices/:deviceId/sensors/:sensorId/history"
                element={<SensorHistory />}
              />
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
              <Route path="/admin/compare" element={<AdminCompare />} />
              <Route path="/admin/compare/sensor/:sensorId" element={<CompareDetail />} />
            </Route>
          </Routes>
        </Layout>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DeviceProvider>
          <AppContent />
        </DeviceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}