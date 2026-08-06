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
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(rgba(12, 55, 33, 0.55), rgba(12, 55, 33, 0.45)), url('/farm.jpg')",
      }}
    >
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-card p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">New Station</p>
        <h1 className="text-2xl font-bold mb-6">Create your account</h1>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        <div className="mb-4">
          <label htmlFor="name" className="block text-xs font-semibold text-ink-dim mb-1.5">Full name</label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-600 transition"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-xs font-semibold text-ink-dim mb-1.5">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-600 transition"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-xs font-semibold text-ink-dim mb-1.5">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-600 transition"
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:brightness-105 transition disabled:opacity-60">
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>

        <p className="text-sm text-ink-dim text-center mt-5">
          Already registered? <Link to="/login" className="text-brand-600 font-bold">Sign in</Link>
        </p>
      </form>
    </div>
  );
}