import { useDevices } from "../context/DeviceContext";
import ForecastPanel from "../components/ForecastPanel";

export default function ForecastPage() {
  const { selectedDevice } = useDevices();
  if (!selectedDevice) return <div className="text-center text-ink-dim py-12">No device selected</div>;

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-extrabold mb-6">Forecast</h1>
      <ForecastPanel
        deviceId={selectedDevice.id}
        hasLocation={selectedDevice.latitude != null && selectedDevice.longitude != null}
      />
    </div>
  );
}

