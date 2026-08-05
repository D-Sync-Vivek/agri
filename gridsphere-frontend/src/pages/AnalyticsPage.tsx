import { useDevices } from "../context/DeviceContext";
import WindAnalyticsPanel from "../components/WindAnalyticsPanel";
import RainAnalyticsPanel from "../components/RainAnalyticsPanel";

export default function AnalyticsPage() {
  const { selectedDevice } = useDevices();
  if (!selectedDevice) return <div className="text-center text-ink-dim py-12">No device selected</div>;

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-extrabold mb-6">Analytics</h1>
      <WindAnalyticsPanel deviceId={selectedDevice.id} />
      <RainAnalyticsPanel deviceId={selectedDevice.id} />
    </div>
  );
}