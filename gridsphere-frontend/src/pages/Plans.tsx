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
    <div className="container">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Billing</p>
          <h1 className="page-title">Subscription Plans</h1>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {plans === null && !error && <div className="loading-text">Loading plans…</div>}

      {plans && plans.length === 0 && (
        <div className="empty-state panel">
          <h3>No plans configured</h3>
          <p>Add rows to the subscription_plans table to see them here.</p>
        </div>
      )}

      {plans && plans.length > 0 && (
        <div className="device-grid">
          {plans.map((plan) => (
            <div key={plan.id} className="panel" style={{ padding: 20 }}>
              <p className="section-title">{plan.planCode}</p>
              <div className="device-name">{plan.planName}</div>
              <p className="muted" style={{ margin: "8px 0 16px" }}>
                {plan.maxDevices ?? "∞"} devices · {plan.maxSensorsPerDevice ?? "∞"} sensors/device ·{" "}
                {plan.dataRetentionDays ?? "∞"}d retention
              </p>
              <div className="flex-row">
                <div>
                  <span className="readout-value" style={{ color: "var(--ink)", fontSize: 20 }}>
                    ${plan.priceMonthly ?? "—"}
                  </span>
                  <span className="muted"> /mo</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


