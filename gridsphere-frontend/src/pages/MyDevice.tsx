import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useDevices } from "../context/DeviceContext";
import {
  getMyDevicesWithSubscriptions,
  listSubscriptionPlans,
  createCheckoutOrder,
  verifyPayment,
} from "../api/subscriptions";
import { DeviceWithSubscription, SubscriptionPlan } from "../types";
import { openRazorpayCheckout } from "../utils/razorpay";
import { Lock, CheckCircle2 } from "lucide-react";

export default function MyDevices() {
  const { user } = useAuth();
  const { refresh: refreshDeviceContext } = useDevices();
  const [devices, setDevices] = useState<DeviceWithSubscription[] | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [payingDeviceId, setPayingDeviceId] = useState<number | null>(null);
  const [selectingPlanFor, setSelectingPlanFor] = useState<DeviceWithSubscription | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  function loadData() {
    setError(null);
    Promise.all([getMyDevicesWithSubscriptions(), listSubscriptionPlans()])
      .then(([d, p]) => {
        setDevices(d);
        setPlans(p);
      })
      .catch((err) => setError(err?.response?.data?.message || "Could not load devices"));
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubscribe(device: DeviceWithSubscription, plan: SubscriptionPlan) {
    const codeToApply = couponApplied ? couponCode.trim() : undefined;
    setSelectingPlanFor(null);
    setCouponCode("");
    setCouponApplied(false);
    setPayingDeviceId(device.id);
    setError(null);
    try {
      const order = await createCheckoutOrder(device.id, plan.id, codeToApply);
      openRazorpayCheckout({
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: order.keyId,
        deviceName: device.deviceName || device.deviceUid,
        userEmail: user?.email,
        userName: user?.name || undefined,
        onSuccess: async (resp) => {
          try {
            await verifyPayment(resp);
            loadData();
            refreshDeviceContext();
          } catch {
            setError("Payment succeeded but verification failed. Contact support.");
          } finally {
            setPayingDeviceId(null);
          }
        },
        onDismiss: () => setPayingDeviceId(null),
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not start checkout");
      setPayingDeviceId(null);
    }
  }

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Billing</p>
        <h1 className="text-2xl font-extrabold">My Devices</h1>
        <p className="text-sm text-ink-dim mt-1">
          Each device needs an active subscription for its data to be visible.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      {devices === null && !error && <div className="text-center text-ink-dim py-12">Loading devices…</div>}

      {devices && devices.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-card">
          <h3 className="text-lg font-bold mb-2">No devices yet</h3>
          <p className="text-ink-dim">Ask your admin to grant you access to a device.</p>
        </div>
      )}

      {devices && devices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((d) => (
            <div key={d.id} className="bg-white border border-gray-200 rounded-xl shadow-card p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-dim">{d.deviceUid}</p>
                  <div className="text-lg font-bold">{d.deviceName || "Unnamed device"}</div>
                </div>
                {d.hasAccess ? (
                  <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 text-xs font-bold px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100 text-xs font-bold px-2 py-1 rounded-full">
                    <Lock className="w-3.5 h-3.5" /> Locked
                  </span>
                )}
              </div>

              {d.locationName && <p className="text-sm text-ink-dim mb-3">{d.locationName}</p>}

              {d.hasAccess ? (
                <p className="text-sm text-ink-dim">
                  Plan: {d.subscription?.plan?.planName || "—"}
                  {d.subscription?.endDate && (
                    <> · Renews {new Date(d.subscription.endDate).toLocaleDateString()}</>
                  )}
                </p>
              ) : (
                <button
                  onClick={() => setSelectingPlanFor(d)}
                  disabled={payingDeviceId === d.id}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-105 transition disabled:opacity-60"
                >
                  {payingDeviceId === d.id ? "Processing…" : "Subscribe to unlock"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectingPlanFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-1">Choose a plan</h3>
            <p className="text-sm text-ink-dim mb-4">
              For {selectingPlanFor.deviceName || selectingPlanFor.deviceUid}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-ink-dim mb-1.5">Have a coupon code?</label>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponApplied(false);
                  }}
                  placeholder="e.g. AB3XQ9KL"
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:border-brand-600"
                />
                <button
                  type="button"
                  onClick={() => setCouponApplied(true)}
                  disabled={!couponCode.trim() || couponApplied}
                  className="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-105 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {couponApplied ? "Applied" : "Apply"}
                </button>
              </div>
              {couponApplied && (
                <p className="text-xs text-green-700 font-semibold mt-1.5">✓ Coupon will be applied at checkout</p>
              )}
            </div>

            <div className="space-y-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handleSubscribe(selectingPlanFor, plan)}
                  className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 hover:border-brand-400 hover:bg-brand-50 transition text-left"
                >
                  <div>
                    <div className="font-bold">{plan.planName}</div>
                    <div className="text-xs text-ink-dim">{plan.maxSensorsPerDevice ?? "∞"} sensors/device</div>
                  </div>
                  <div className="text-lg font-extrabold">₹{plan.priceMonthly ?? "—"}/mo</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setSelectingPlanFor(null);
                setCouponCode("");
                setCouponApplied(false);
              }}
              className="mt-4 w-full text-center text-sm text-ink-dim hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}