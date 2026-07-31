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
      await setDeviceCrop(device.id, crop.code);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not add crop");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden mb-5">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-dim">Crop</span>
        <button onClick={() => setShowAddForm((v) => !v)} className="bg-brand-50 text-brand-700 font-semibold px-4 py-2 rounded-full text-sm hover:brightness-95 transition">
          {showAddForm ? "Cancel" : "+ Add crop"}
        </button>
      </div>
      <div className="p-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        {showAddForm && (
          <form onSubmit={handleAddCrop} className="flex items-center gap-2 mb-4">
            <input
              autoFocus
              placeholder="e.g. Grape, Tomato, Wheat"
              value={newCropName}
              onChange={(e) => setNewCropName(e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
            />
            <button type="submit" disabled={isAdding} className="bg-brand-600 text-white font-bold px-4 py-2.5 rounded-lg hover:brightness-105 transition disabled:opacity-60">
              {isAdding ? "Adding…" : "Add"}
            </button>
          </form>
        )}

        {isLoadingCrops ? (
          <p className="text-ink-dim text-sm">Loading crops…</p>
        ) : crops.length === 0 ? (
          <p className="text-ink-dim text-sm">No crops yet - add one above to get started.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {crops.map((crop) => {
              const isActive = device.cropId === crop.id;
              return (
                <button
                  key={crop.id}
                  onClick={() => handleSelect(crop.code)}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'bg-transparent border border-gray-200 text-ink hover:border-brand-600'
                  }`}
                >
                  {crop.name}
                </button>
              );
            })}
          </div>
        )}

        {!device.cropId && crops.length > 0 && (
          <p className="text-xs text-ink-dim mt-2">Select a crop to unlock the AI advisory below.</p>
        )}
      </div>
    </div>
  );
}