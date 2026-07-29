// src/components/AddSensorModal.tsx
import { FormEvent, useEffect, useMemo, useState } from "react";
import { installDeviceSensor } from "../api/sensors";
import { SensorType } from "../types";
import { slugify } from "../utils/slugify";

interface Props {
  deviceId: number;
  sensorTypes: SensorType[];
  /** Sensor type IDs already actively installed on this device - filtered out of the picker so the same type can't be added twice. */
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
  // Preview only - the server derives (and is the source of truth for) the
  // actual label from the sensor type name, exactly the same way.
  const labelPreview = selectedType ? slugify(selectedType.name) : "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (sensorTypeId === "") return;
    setError(null);
    setIsSubmitting(true);
    try {
      // Get the selected type to compute the label
      const type = availableTypes.find((t) => t.id === sensorTypeId);
      if (!type) throw new Error("Sensor type not found");

      const label = slugify(type.name); // e.g. "wind_speed"

      await installDeviceSensor({
        device_id: deviceId,
        sensor_type_id: sensorTypeId,
        sensor_label: label,   // required
        // hardware_port, calibration_offset, calibration_scale are optional
      });
      onCreated();
    } catch (err: any) {
      // 🛑 FIX: Safely handle both string errors AND Zod validation arrays
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        // Format Zod validation errors into a readable string
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
        <p className="section-title">Install Sensor</p>

        {error && <div className="error-banner">{error}</div>}

        {availableTypes.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>
            Every available sensor type is already installed and active on this device. Deactivate one first (Sensors
            tab) if you want to swap it out.
          </p>
        ) : (
          <>
            <div className="field">
              <label>Sensor type *</label>
              <select required value={sensorTypeId} onChange={(e) => setSensorTypeId(parseInt(e.target.value, 10))}>
                {availableTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Label</label>
              <input value={labelPreview} disabled style={{ background: "var(--bg)", color: "var(--ink-dim)" }} />
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Auto-filled from the sensor type - always lowercase with underscores, so it always matches what{" "}
                <code>/readings/add</code> expects. Not editable, to avoid label/type mismatches.
              </p>
            </div>
          </>
        )}

        <div className="flex-row" style={{ marginTop: 20 }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <div className="spacer" />
          {availableTypes.length > 0 && (
            <button type="submit" className="btn-primary" style={{ width: "auto" }} disabled={isSubmitting}>
              {isSubmitting ? "Installing…" : "Install sensor"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}