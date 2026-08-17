import { useEffect, useState } from "react";
import {
  adminListDevices,
  AdminDeviceResponse,
  adminCreateCoupon,
  adminListCoupons,
  adminRevokeCoupon,
} from "../api/admin";
import { CheckCircle2, XCircle, Search, Copy, Trash2, Plus, Ticket } from "lucide-react";
import { Coupon } from "../types";

export default function AdminSubscriptions() {
  const [devices, setDevices] = useState<AdminDeviceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "fully_paid" | "partial" | "unpaid">("all");

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(10);
  const [expiryMinutes, setExpiryMinutes] = useState(60);
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  function loadDevices() {
    setIsLoading(true);
    adminListDevices()
      .then(setDevices)
      .catch((err) => setError(err?.response?.data?.message || "Could not load subscription data"))
      .finally(() => setIsLoading(false));
  }

  function loadCoupons() {
    setCouponsLoading(true);
    adminListCoupons()
      .then(setCoupons)
      .catch((err) => setCouponError(err?.response?.data?.message || "Could not load coupons"))
      .finally(() => setCouponsLoading(false));
  }

  useEffect(() => {
    loadDevices();
    loadCoupons();
  }, []);

  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponError(null);
    setIsCreatingCoupon(true);
    try {
      await adminCreateCoupon(discountPercent, expiryMinutes);
      setShowCouponForm(false);
      setDiscountPercent(10);
      setExpiryMinutes(60);
      loadCoupons();
    } catch (err: any) {
      setCouponError(err?.response?.data?.message || "Could not create coupon");
    } finally {
      setIsCreatingCoupon(false);
    }
  }

  async function handleRevoke(couponId: number) {
    if (!window.confirm("Revoke this coupon? This cannot be undone.")) return;
    try {
      await adminRevokeCoupon(couponId);
      loadCoupons();
    } catch (err: any) {
      setCouponError(err?.response?.data?.message || "Could not revoke coupon");
    }
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  }

  function couponStatus(c: Coupon): { label: string; className: string } {
    if (c.usedByUserId) return { label: "Used", className: "bg-gray-100 text-gray-600" };
    if (new Date(c.expiresAt) < new Date()) return { label: "Expired", className: "bg-red-100 text-red-700" };
    return { label: "Active", className: "bg-green-100 text-green-700" };
  }

  const filtered = devices.filter((d) => {
    const matchesSearch =
      !search ||
      d.deviceUid.toLowerCase().includes(search.toLowerCase()) ||
      (d.deviceName || "").toLowerCase().includes(search.toLowerCase()) ||
      d.users.some((u) => u.email.toLowerCase().includes(search.toLowerCase()) || u.name.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filter === "all") return true;
    if (d.users.length === 0) return filter === "unpaid";
    if (filter === "fully_paid") return d.activeSubscriptionCount === d.users.length;
    if (filter === "unpaid") return d.activeSubscriptionCount === 0;
    if (filter === "partial") return d.activeSubscriptionCount > 0 && d.activeSubscriptionCount < d.users.length;
    return true;
  });

  const totals = devices.reduce(
    (acc, d) => {
      acc.totalUsers += d.users.length;
      acc.paidUsers += d.activeSubscriptionCount;
      return acc;
    },
    { totalUsers: 0, paidUsers: 0 }
  );

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Admin</p>
          <h1 className="text-2xl font-extrabold">Subscriptions</h1>
          <p className="text-sm text-ink-dim mt-1">Payment status per user, per device.</p>
        </div>
        <button
          onClick={loadDevices}
          disabled={isLoading}
          className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <SummaryStat label="Devices" value={devices.length} />
          <SummaryStat label="Total (user, device) pairs" value={totals.totalUsers} />
          <SummaryStat
            label="Paid pairs"
            value={`${totals.paidUsers}/${totals.totalUsers}`}
            valueClassName={totals.paidUsers === totals.totalUsers && totals.totalUsers > 0 ? "text-green-700" : "text-amber-700"}
          />
        </div>
      )}

      {/* ===== COUPONS SECTION ===== */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden mb-8">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold">Discount Coupons</h3>
          </div>
          <button
            onClick={() => setShowCouponForm(true)}
            className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider hover:brightness-105 transition"
          >
            <Plus className="w-4 h-4" />
            New Coupon
          </button>
        </div>

        {couponError && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{couponError}</div>
        )}

        {couponsLoading ? (
          <div className="text-center text-ink-dim py-8">Loading coupons…</div>
        ) : coupons.length === 0 ? (
          <div className="text-center text-ink-dim py-8">No coupons created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Code</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Discount</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Expires</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Status</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3">Used By</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-ink-dim px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const status = couponStatus(c);
                  return (
                    <tr key={c.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold tracking-wider">{c.code}</code>
                          <button onClick={() => handleCopy(c.code)} className="text-ink-dim hover:text-brand-600 transition" title="Copy code">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {copiedCode === c.code && <span className="text-xs text-green-600 font-semibold">Copied!</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{c.discountPercent}%</td>
                      <td className="px-4 py-3 text-ink-dim text-xs">{new Date(c.expiresAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${status.className}`}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-dim">
                        {c.usedBy ? `${c.usedBy.name} (${c.usedBy.email})` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {!c.usedByUserId && (
                          <button onClick={() => handleRevoke(c.id)} className="text-red-600 hover:text-red-700 transition" title="Revoke">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== DEVICE / USER PAYMENT SECTION ===== */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-55">
          <Search className="w-4 h-4 text-ink-dim absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search device, name, or email…"
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-brand-600"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "fully_paid", "partial", "unpaid"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                filter === f ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-ink-dim hover:border-brand-600"
              }`}
            >
              {f === "all" ? "All" : f === "fully_paid" ? "Fully Paid" : f === "partial" ? "Partial" : "Unpaid"}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="text-center text-ink-dim py-12">Loading…</div>}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-card">
          <h3 className="text-lg font-bold mb-2">No matching devices</h3>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((d) => (
            <div key={d.id} className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-dim">{d.deviceUid}</p>
                  <div className="text-base font-bold">{d.deviceName || "Unnamed device"}</div>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    d.users.length === 0
                      ? "bg-gray-100 text-gray-500"
                      : d.activeSubscriptionCount === d.users.length
                      ? "bg-green-100 text-green-700"
                      : d.activeSubscriptionCount === 0
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {d.activeSubscriptionCount}/{d.users.length} paid
                </span>
              </div>

              {d.users.length === 0 ? (
                <div className="px-4 py-4 text-sm text-ink-dim">No users assigned to this device.</div>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {d.users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-2.5 w-2/5">
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-xs text-ink-dim">{u.email}</div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-ink-dim">{u.isOwner ? "owner" : u.role || "—"}</td>
                        <td className="px-4 py-2.5 text-right">
                          {u.hasActiveSubscription ? (
                            <span className="inline-flex items-center gap-1 text-green-700 text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold">
                              <XCircle className="w-3.5 h-3.5" /> Unpaid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Coupon Modal */}
      {showCouponForm && (
        <div className="modal-backdrop" onClick={() => setShowCouponForm(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleCreateCoupon}>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-4">New Coupon</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Discount percentage</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-dim mb-1.5">Expires in (minutes)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={expiryMinutes}
                  onChange={(e) => setExpiryMinutes(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowCouponForm(false)} className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition">
                Cancel
              </button>
              <button type="submit" disabled={isCreatingCoupon} className="bg-brand-600 text-white font-bold px-4 py-2 rounded-lg hover:brightness-105 transition disabled:opacity-60">
                {isCreatingCoupon ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value, valueClassName = "" }: { label: string; value: string | number; valueClassName?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-card p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-1">{label}</p>
      <div className={`text-xl font-extrabold ${valueClassName}`}>{value}</div>
    </div>
  );
}

