import { Device } from "../types";

interface Props {
  device: Device;
}

export default function FooterSummary({ device }: Props) {
  const isActive = device.status === "active";
  const uptime = device.lastSeenAt
    ? Math.floor((Date.now() - new Date(device.lastSeenAt).getTime()) / (1000 * 60 * 60 * 24)) + "d"
    : "—";

  return (
    <section className="w-full bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-card flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 mt-4">
      <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 sm:gap-8 w-full md:w-auto">
        <div className="text-center sm:text-left">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">System Status</div>
          <div className="flex items-center justify-center sm:justify-start gap-2 text-brand-600 font-bold">
            <span className="w-3 h-3 rounded-full bg-brand-600 animate-pulse" />
            {isActive ? "100% Active" : "Offline"}
          </div>
        </div>
        <div className="hidden sm:block w-px h-8 bg-gray-200" />
        <div className="text-center sm:text-left">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Health Score</div>
          <div className="text-lg font-bold text-ink">98/100</div>
        </div>
        <div className="hidden sm:block w-px h-8 bg-gray-200" />
        <div className="text-center sm:text-left">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Uptime</div>
          <div className="text-lg font-bold text-ink">{uptime}</div>
        </div>
        <div className="hidden sm:block w-px h-8 bg-gray-200" />
        <div className="text-center sm:text-left">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Network</div>
          <div className="text-lg font-bold text-ink">{isActive ? "Stable" : "Disconnected"}</div>
        </div>
      </div>
      <button className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap w-full sm:w-auto">
        View Full Report
      </button>
    </section>
  );
}