import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchCurrentUser } from "../api/auth";
import { User } from "../types";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser()
      .then(setProfile)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load profile"));
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Account</p>
          <h1 className="text-2xl font-extrabold">Profile</h1>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">Account details</span>
          <span className="inline-block text-xs font-bold uppercase text-brand-700 bg-brand-50 px-3 py-1 rounded-full">
            {profile?.role || user?.role || "user"}
          </span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-ink-dim">Name</div>
              <div className="font-bold">{profile?.name || user?.name}</div>
            </div>
            <div>
              <div className="text-xs text-ink-dim">Email</div>
              <div className="font-bold">{profile?.email || user?.email}</div>
            </div>
            {profile?.phone && (
              <div>
                <div className="text-xs text-ink-dim">Phone</div>
                <div className="font-bold">{profile.phone}</div>
              </div>
            )}
            {profile?.company_name && (
              <div>
                <div className="text-xs text-ink-dim">Company</div>
                <div className="font-bold">{profile.company_name}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <button onClick={handleLogout} className="bg-transparent border border-gray-200 text-ink px-4 py-2.5 rounded-lg hover:border-brand-600 transition">
        Sign out
      </button>

      <Link to="/plans" className="block mt-4 text-sm text-brand-600 font-semibold hover:underline">View subscription plans →</Link>
    </div>
  );
}