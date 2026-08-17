import { Battery, MapPin, Clock, Wifi } from "lucide-react";
import { Device } from "../types";

interface Props {
  device: Device;
}

export default function DeviceVitalsBanner({ device }: Props) {
  const isActive = device.status === "active";
  const connectivity = isActive ? "Strong" : "Offline";

  // Dynamic background based on device status
  const bgClass = isActive
    ? "bg-linear-to-r from-brand-600 to-brand-700"
    : "bg-linear-to-r from-red-500 to-orange-500";

  return (
    <section
      className={`w-full rounded-2xl ${bgClass} text-white flex flex-wrap items-center justify-between px-4 sm:px-6 py-4 sm:py-5 shadow-card relative overflow-hidden`}
    >
      <div className="flex flex-col justify-center h-full z-10 w-full sm:w-auto">
        <h2 className="text-headline-md font-bold mb-2 sm:mb-3">Device Vitals</h2>
        <div className="flex flex-wrap gap-4 sm:gap-6 items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Battery className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80">Battery</div>
              <div className="font-bold text-base sm:text-lg">
                {device.batteryLevel != null ? `${device.batteryLevel.toFixed(0)}%` : "—"}
              </div>
            </div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80">Location</div>
              <div className="font-bold text-base sm:text-lg">{device.locationName || "Not set"}</div>
            </div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80">Reporting</div>
              <div className="font-bold text-base sm:text-lg">Every {device.frequency} min</div>
            </div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80">Connectivity</div>
              <div className="font-bold text-base sm:text-lg">{connectivity}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none flex justify-end items-center pr-8">
        <img src="/security.png" alt="Security" className="h-28 invert" />
      </div>
    </section>
  );
}

