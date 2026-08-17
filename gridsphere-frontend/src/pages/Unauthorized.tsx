import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-card">
        <h3 className="text-lg font-bold mb-2">Not authorized</h3>
        <p className="text-ink-dim">Your account role doesn't have access to this page.</p>
        <Link to="/" className="inline-block mt-4 bg-brand-50 text-brand-700 font-semibold px-4 py-2 rounded-full hover:brightness-95 transition">Back to home</Link>
      </div>
    </div>
  );
}

