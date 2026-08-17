import { FormEvent, useEffect, useMemo, useState } from "react";
import { installDeviceSensor } from "../api/sensors";
import { SensorType } from "../types";
import { slugify } from "../utils/slugify";

interface Props {
  deviceId: number;
  sensorTypes: SensorType[];
  installedSensorTypeIds: number[];
  onClose: () => void;
  onCreated: () => void;
}

export default function AddSensorModal({ deviceId, sensorTypes, installedSensorTypeIds, onClose, onCreated }: Props) {
  const availableTypes = useMemo(
    () => sensorTypes.filter((t) => !installedSensorTypeIds.includes(t.id)),
    [sensorTypes, installedSensorTypeIds]
  );

  const [sensorTypeId, setSensorTypeId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (availableTypes.length > 0 && sensorTypeId === "") {
      setSensorTypeId(availableTypes[0].id);
    }
  }, [availableTypes, sensorTypeId]);

  const selectedType = availableTypes.find((t) => t.id === sensorTypeId);
  const labelPreview = selectedType ? slugify(selectedType.name) : "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (sensorTypeId === "") return;
    setError(null);
    setIsSubmitting(true);
    try {
      const type = availableTypes.find((t) => t.id === sensorTypeId);
      if (!type) throw new Error("Sensor type not found");
      const label = slugify(type.name);
      await installDeviceSensor({
        device_id: deviceId,
        sensor_type_id: sensorTypeId,
        sensor_label: label,
      });
      onCreated();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((e: any) => e.message || "Invalid field").join(", "));
      } else {
        setError(detail || "Could not install sensor");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <p className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-4">Install Sensor</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        {availableTypes.length === 0 ? (
          <p className="text-ink-dim text-sm">
            Every available sensor type is already installed and active on this device. Deactivate one first (Sensors
            tab) if you want to swap it out.
          </p>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-ink-dim mb-1.5">Sensor type *</label>
              <select
                required
                value={sensorTypeId}
                onChange={(e) => setSensorTypeId(parseInt(e.target.value, 10))}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
              >
                {availableTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-dim mb-1.5">Label</label>
              <input
                value={labelPreview}
                disabled
                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-ink-dim cursor-not-allowed"
              />
              <p className="text-xs text-ink-dim mt-1.5">
                Auto-filled from the sensor type - always lowercase with underscores, so it always matches what{" "}
                <code>/readings/add</code> expects.
              </p>
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="bg-transparent border border-gray-200 text-ink px-4 py-2 rounded-lg hover:border-brand-600 transition">Cancel</button>
          {availableTypes.length > 0 && (
            <button type="submit" disabled={isSubmitting} className="bg-brand-600 text-white font-bold px-4 py-2 rounded-lg hover:brightness-105 transition disabled:opacity-60">
              {isSubmitting ? "Installing…" : "Install sensor"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

