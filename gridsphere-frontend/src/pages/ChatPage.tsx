import { useDevices } from "../context/DeviceContext";
import ChatPanel from "../components/ChatPanel";

export default function ChatPage() {
  const { selectedDevice } = useDevices();
  if (!selectedDevice) return <div className="text-center text-ink-dim py-12">No device selected</div>;

  return (
    <div className="w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] px-4 sm:px-6 lg:px-8 py-6 flex flex-col overflow-hidden">
      <h1 className="text-2xl font-extrabold mb-4">AI Chat</h1>
      <div className="flex-1 min-h-0">
        <ChatPanel deviceId={selectedDevice.id} />
      </div>
    </div>
  );
}

