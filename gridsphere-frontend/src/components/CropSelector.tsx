import { FormEvent, useEffect, useState } from "react";
import { listCrops, setDeviceCrop, createCrop } from "../api/crops";
import { useDevices } from "../context/DeviceContext";
import { Crop, Device } from "../types";

export default function CropSelector({ device }: { device: Device }) {
  const { refresh } = useDevices();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoadingCrops, setIsLoadingCrops] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newCropName, setNewCropName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  function loadCrops() {
    setIsLoadingCrops(true);
    listCrops()
      .then(setCrops)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load crops"))
      .finally(() => setIsLoadingCrops(false));
  }

  useEffect(() => {
    loadCrops();
  }, []);

  async function handleSelect(cropCode: string) {
    setIsSaving(true);
    setError(null);
    try {
      // Toggle off if re-selecting the currently active crop.
      const currentCode = crops.find((c) => c.id === device.cropId)?.code;
      await setDeviceCrop(device.id, currentCode === cropCode ? null : cropCode);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not update crop");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddCrop(e: FormEvent) {
    e.preventDefault();
    if (!newCropName.trim()) return;
    setIsAdding(true);
    setError(null);
    try {
      const crop = await createCrop(newCropName.trim());
      setNewCropName("");
      setShowAddForm(false);
      loadCrops();
      // Immediately select the crop the user just added on this device.
      await setDeviceCrop(device.id, crop.code);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not add crop");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      <div className="panel-header">
        <span className="panel-title">Crop</span>
        <button className="btn-ghost" onClick={() => setShowAddForm((v) => !v)}>
          {showAddForm ? "Cancel" : "+ Add crop"}
        </button>
      </div>
      <div className="panel-body">
        {error && <div className="error-banner">{error}</div>}

        {showAddForm && (
          <form onSubmit={handleAddCrop} className="flex-row" style={{ marginBottom: 14 }}>
            <input
              autoFocus
              placeholder="e.g. Grape, Tomato, Wheat"
              value={newCropName}
              onChange={(e) => setNewCropName(e.target.value)}
              style={{
                flex: 1,
                background: "#fff",
                border: "1px solid var(--hairline)",
                borderRadius: "var(--radius-sm)",
                padding: "9px 12px",
                fontSize: 14,
              }}
            />
            <button type="submit" className="btn-primary" style={{ width: "auto" }} disabled={isAdding}>
              {isAdding ? "Adding…" : "Add"}
            </button>
          </form>
        )}

        {isLoadingCrops ? (
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Loading crops…
          </p>
        ) : crops.length === 0 ? (
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            No crops yet - add one above to get started.
          </p>
        ) : (
          <div className="flex-row" style={{ flexWrap: "wrap", gap: 8 }}>
            {crops.map((crop) => {
              const isActive = device.cropId === crop.id;
              return (
                <button
                  key={crop.id}
                  onClick={() => handleSelect(crop.code)}
                  disabled={isSaving}
                  className={isActive ? "btn-ghost" : "btn-secondary"}
                  style={isActive ? { background: "var(--brand-green)", color: "#fff" } : undefined}
                >
                  {crop.name}
                </button>
              );
            })}
          </div>
        )}

        {!device.cropId && crops.length > 0 && (
          <p className="muted" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
            Select a crop to unlock the AI advisory below.
          </p>
        )}
      </div>
    </div>
  );
}


