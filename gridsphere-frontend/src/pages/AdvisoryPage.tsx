import { useDevices } from "../context/DeviceContext";
import CropSelector from "../components/CropSelector";
import AdvisoryPanel from "../components/AdvisoryPanel";

export default function AdvisoryPage() {
  const { selectedDevice } = useDevices();
  if (!selectedDevice) return <div className="text-center text-ink-dim py-12">No device selected</div>;

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-extrabold mb-6">Advisory</h1>
      <CropSelector device={selectedDevice} />
      <AdvisoryPanel deviceId={selectedDevice.id} hasCrop={selectedDevice.cropId != null} />
    </div>
  );
}