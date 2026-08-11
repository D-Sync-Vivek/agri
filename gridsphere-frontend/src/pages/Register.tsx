import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register({ name, email, password });
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not create account");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat p-4"
      style={{
        backgroundImage:
          "linear-gradient(rgba(12, 55, 33, 0.55), rgba(12, 55, 33, 0.45)), url('/login-bg.png')",
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-card border border-gray-200 p-6 sm:p-8">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xl font-bold">A</span>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">AgriSense</h1>
          </div>
        </div>

        <div className="mb-5 sm:mb-6">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">New Account</p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Create your account</h2>
          <p className="text-xs sm:text-sm text-ink-dim mt-1">Start managing your agricultural ecosystem.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-ink-dim mb-1.5">
              Full name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-brand-600 transition"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-ink-dim mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-brand-600 transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-ink-dim mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-brand-600 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-600 text-white font-bold py-2.5 sm:py-3 rounded-lg hover:brightness-105 transition disabled:opacity-60 text-sm sm:text-base"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-xs sm:text-sm text-ink-dim text-center mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}