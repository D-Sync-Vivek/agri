import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminStats, SystemStats, checkDeepSeekStatus, getDeepSeekBalance } from "../api/admin";
import { Users, Router, BarChart3, Database, ShieldCheck, ShieldAlert, Wallet, AlertTriangle } from "lucide-react";

export default function AdminOverview() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deepSeekStatus, setDeepSeekStatus] = useState<{ ok: boolean; message: string; model?: string } | null>(null);
  const [deepSeekBalance, setDeepSeekBalance] = useState<{ ok: boolean; balance?: number; currency?: string; message?: string } | null>(null);
  const [isCheckingAi, setIsCheckingAi] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [statusCheckedAt, setStatusCheckedAt] = useState<Date | null>(null);
  const [balanceCheckedAt, setBalanceCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load stats"))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    checkDeepSeekStatus()
      .then(setDeepSeekStatus)
      .catch(() => setDeepSeekStatus({ ok: false, message: "Could not check AI status" }));
    getDeepSeekBalance()
      .then(setDeepSeekBalance)
      .catch(() => setDeepSeekBalance({ ok: false, message: "Could not fetch balance" }));
  }, []);

  async function refreshAiStatus() {
    setIsCheckingAi(true);
    try {
      const result = await checkDeepSeekStatus();
      setDeepSeekStatus(result);
    } catch {
      setDeepSeekStatus({ ok: false, message: "Could not check AI status" });
    } finally {
      setIsCheckingAi(false);
      setStatusCheckedAt(new Date());
    }
  }

  async function refreshAiBalance() {
    setIsCheckingBalance(true);
    try {
      const result = await getDeepSeekBalance();
      setDeepSeekBalance(result);
    } catch {
      setDeepSeekBalance({ ok: false, message: "Could not fetch balance" });
    } finally {
      setIsCheckingBalance(false);
      setBalanceCheckedAt(new Date());
    }
  }

  function formatLastChecked(date: Date | null): string {
    if (!date) return "";
    const secondsAgo = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secondsAgo < 5) return "Last checked just now";
    if (secondsAgo < 60) return `Last checked ${secondsAgo}s ago`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) return `Last checked ${minutesAgo}m ago`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return `Last checked ${hoursAgo}h ago`;
    return `Last checked at ${date.toLocaleString()}`;
  }

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center text-ink-dim py-12">Loading stats…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">ADMIN</p>
          <h1 className="text-3xl font-extrabold text-gray-900">Overview</h1>
          <p className="text-sm text-ink-dim mt-1">Monitor your agricultural ecosystem at a glance.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-brand-700 hover:bg-gray-50 transition shadow-sm"
          >
            <Users className="w-4 h-4" />
            Manage Users
          </Link>
          <Link
            to="/admin/devices"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:brightness-105 transition shadow-sm"
          >
            <Router className="w-4 h-4" />
            Manage Devices
          </Link>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden shadow-sm relative mb-8 bg-linear-to-r from-brand-600 to-brand-800">
        <img
          className="w-full h-full object-cover absolute inset-0 opacity-40"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCR6BXtUUZaiz93e1amazvxw-wObCGnjyYxEoElnE9H44jmRsCyj1wVGR-H6HwTU28G5T0LxDcEiFZW7CxfCBj7Aes9KncZ7hm0XVICeIBRsXuV_CAVc68PEJOGkt3fLOc71OJ2DGt5oPYlsCByMqRqBfnsSZ3QnTYcbJCvjJGOwPNnFVzc3Ef6umBa3AcRySRLcjJLH6twypJRk-fhlmRVyokRgo3u97XB_b8VfTFrSmBEMYB6JphO"
          alt="Smart Farming Landscape"
        />
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <h2 className="text-2xl md:text-4xl font-extrabold drop-shadow">AgriSense Ecosystem</h2>
            <p className="text-sm md:text-base text-white/80 mt-1">Monitor your agricultural ecosystem at a glance.</p>
          </div>
        </div>
      </div>

      {/* System Health Section */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">System Health</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* AI Status Card */}
          <div className={`bg-white rounded-xl border p-6 shadow-card flex items-center justify-between ${
            deepSeekStatus?.ok ? "border-green-200" : "border-red-200"
          }`}>
            <div>
              <div className="flex items-center gap-2">
                {deepSeekStatus?.ok ? (
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                )}
                <span className="font-semibold text-gray-900">AI Assistant</span>
              </div>
              <p className="text-sm text-ink-dim mt-1">
                {deepSeekStatus?.ok ? "Operational" : "Unavailable"}
              </p>
              <p className="text-xs text-ink-dim mt-0.5">
                {deepSeekStatus?.message}
                {deepSeekStatus?.model && ` (model: ${deepSeekStatus.model})`}
              </p>
              {statusCheckedAt && (
                <p className="text-xs text-ink-dim/70 mt-0.5">{formatLastChecked(statusCheckedAt)}</p>
              )}
            </div>
            <button
              onClick={refreshAiStatus}
              disabled={isCheckingAi}
              className="text-sm text-brand-600 font-semibold hover:underline disabled:opacity-50"
            >
              {isCheckingAi ? "Checking…" : "Check now"}
            </button>
          </div>

          {/* Balance Card – with low‑balance alert */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-brand-600" />
                <span className="font-semibold text-gray-900">DeepSeek Balance</span>
              </div>
              <div className="mt-1">
                {deepSeekBalance?.ok && deepSeekBalance.balance !== undefined ? (
                  <>
                    <p className="text-sm text-ink-dim">
                      {deepSeekBalance.balance.toFixed(4)} {deepSeekBalance.currency || "CNY"}
                    </p>
                    {/* Low‑balance warning */}
                    {deepSeekBalance.balance < 2 && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Low balance – top up soon</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-ink-dim">Unavailable</p>
                )}
              </div>
              <p className="text-xs text-ink-dim mt-0.5">
                {deepSeekBalance?.message || " "}
              </p>
              {balanceCheckedAt && (
                <p className="text-xs text-ink-dim/70 mt-0.5">{formatLastChecked(balanceCheckedAt)}</p>
              )}
            </div>
            <button
              onClick={refreshAiBalance}
              disabled={isCheckingBalance}
              className="text-sm text-brand-600 font-semibold hover:underline disabled:opacity-50 ml-4"
            >
              {isCheckingBalance ? "Checking…" : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid Stats - full width */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Users Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-gray-900">Users</h3>
          </div>
          <div className="space-y-1">
            <MetricRow label="Total Users" subtitle="All registered users" value={stats.users.total} />
            <MetricRow label="Active Users" subtitle="Currently active" value={stats.users.active} />
            <MetricRow label="New (24h)" subtitle="New users in last 24h" value={stats.users.newLast24h} />
          </div>
        </div>

        {/* Devices Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Router className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-gray-900">Devices</h3>
          </div>
          <div className="space-y-1">
            <MetricRow label="Total Devices" subtitle="All registered devices" value={stats.devices.total} />
            <MetricRow label="Online Devices" subtitle="Currently online" value={stats.devices.online} highlight />
            <MetricRow label="New (24h)" subtitle="New devices in last 24h" value={stats.devices.newLast24h} />
          </div>
        </div>

        {/* Data & Sensors Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-gray-900">Data &amp; Sensors</h3>
          </div>
          <div className="space-y-1">
            <MetricRow label="Total Readings" subtitle="All time sensor readings" value={stats.readings.total.toLocaleString()} />
            <MetricRow label="Last 24h Readings" subtitle="Readings in last 24 hours" value={stats.readings.last24h.toLocaleString()} />
            <MetricRow label="Sensors Installed" subtitle="Across all devices" value={stats.sensors.installed} />
          </div>
        </div>

        {/* System Overview – spans 2 columns on desktop */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-gray-900">System Overview</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-brand-50 p-4 rounded-lg border border-brand-100">
              <p className="text-sm font-medium text-brand-800 mb-1">Crops Monitored</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-brand-700">{stats.crops}</span>
                <span className="text-xs text-ink-dim">Crops being monitored</span>
              </div>
            </div>
            <div className="bg-brand-50 p-4 rounded-lg border border-brand-100">
              <p className="text-sm font-medium text-brand-800 mb-1">Active Subscriptions</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-brand-700">{stats.subscriptions}</span>
                <span className="text-xs text-ink-dim">Active subscriptions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for metric rows
function MetricRow({ label, subtitle, value, highlight = false }: { label: string; subtitle: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center border-b border-gray-100 last:border-0 py-2.5">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-ink-dim">{subtitle}</p>
      </div>
      <span className={`text-xl font-bold ${highlight ? "text-brand-600" : "text-gray-900"}`}>{value}</span>
    </div>
  );
}

