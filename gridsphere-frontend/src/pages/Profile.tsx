import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchCurrentUser } from "../api/auth";
import { User } from "../types";
import { Calendar, Mail, Phone, Building, Users, Crown } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser()
      .then((data) => {
        // The backend now returns deviceCount and createdAt
        setProfile(data);
      })
      .catch((err) => setError(err?.response?.data?.detail || "Could not load profile"));
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const displayUser = profile || user;

  const memberSince = displayUser?.createdAt
    ? new Date(displayUser.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Account</p>
          <h1 className="text-2xl font-extrabold">Profile</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden max-w-2xl mx-auto">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-3xl font-bold">
              {displayUser?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-xl font-bold">{displayUser?.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-block text-xs font-bold uppercase bg-brand-50 text-brand-700 px-3 py-1 rounded-full">
                  {displayUser?.role || "user"}
                </span>
                <span className="text-xs text-ink-dim">
                  Member since {memberSince}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-5 h-5 text-ink-dim" />
              <span>{displayUser?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Users className="w-5 h-5 text-ink-dim" />
              <span>
                Device count:{" "}
                <span className="font-semibold">
                  {displayUser?.deviceCount !== undefined ? displayUser.deviceCount : "—"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Crown className="w-5 h-5 text-ink-dim" />
              <span>
                Subscription: <span className="font-semibold">Free</span>
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={handleLogout}
              className="bg-transparent border border-gray-200 text-ink px-4 py-2.5 rounded-lg hover:border-brand-600 transition"
            >
              Sign out
            </button>
            <Link
              to="/plans"
              className="bg-brand-50 text-brand-700 font-semibold px-4 py-2.5 rounded-lg hover:brightness-95 transition"
            >
              View subscription plans →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}