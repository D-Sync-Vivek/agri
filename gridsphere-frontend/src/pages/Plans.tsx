import { useEffect, useState } from "react";
import { listSubscriptionPlans } from "../api/subscriptions";
import { SubscriptionPlan } from "../types";

export default function Plans() {
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSubscriptionPlans()
      .then(setPlans)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load plans"));
  }, []);

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Billing</p>
          <h1 className="text-2xl font-extrabold">Subscription Plans</h1>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      {plans === null && !error && <div className="text-center text-ink-dim py-12">Loading plans…</div>}

      {plans && plans.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-card">
          <h3 className="text-lg font-bold mb-2">No plans configured</h3>
          <p className="text-ink-dim">Add rows to the subscription_plans table to see them here.</p>
        </div>
      )}

      {plans && plans.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white border border-gray-200 rounded-xl shadow-card p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-dim">{plan.planCode}</p>
              <div className="text-lg font-bold">{plan.planName}</div>
              <p className="text-sm text-ink-dim my-2">
                {plan.maxDevices ?? "∞"} devices · {plan.maxSensorsPerDevice ?? "∞"} sensors/device ·{" "}
                {plan.dataRetentionDays ?? "∞"}d retention
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold">₹{plan.priceMonthly ?? "—"}</span>
                <span className="text-ink-dim">/mo</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}