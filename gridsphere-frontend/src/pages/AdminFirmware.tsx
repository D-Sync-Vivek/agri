import { useEffect, useState } from "react";
import { listFirmware, uploadFirmware, deleteFirmware, assignFirmware, Firmware } from "../api/firmware";
import { adminListDevices, AdminDeviceResponse } from "../api/admin";
import { useAuth } from "../context/AuthContext";
import { Upload, Trash2, Send, X } from "lucide-react";

export default function AdminFirmware() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [firmware, setFirmware] = useState<Firmware[]>([]);
  const [devices, setDevices] = useState<AdminDeviceResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [assignTarget, setAssignTarget] = useState<Firmware | null>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<number[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  function load() {
    setIsLoading(true);
    Promise.all([listFirmware(), adminListDevices()])
      .then(([fw, dv]) => {
        setFirmware(fw);
        setDevices(dv);
      })
      .catch((err) => setError(err?.response?.data?.detail || "Could not load firmware"))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !version.trim()) return;
    setIsUploading(true);
    setError(null);
    try {
      await uploadFirmware(file, version.trim());
      setFile(null);
      setVersion("");
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this firmware? Fails if any device still targets it.")) return;
    try {
      await deleteFirmware(id);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Delete failed");
    }
  }

  async function handleAssign() {
    if (!assignTarget || selectedDeviceIds.length === 0) return;
    setIsAssigning(true);
    setError(null);
    try {
      await assignFirmware(assignTarget.id, selectedDeviceIds);
      setAssignTarget(null);
      setSelectedDeviceIds([]);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Assign failed");
    } finally {
      setIsAssigning(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-ink-dim">
        <p className="text-lg font-bold">Admin access required</p>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Firmware (OTA)</h2>
        <p className="text-sm text-ink-dim mt-1">
          Upload firmware images and push updates to individual or selected devices. A device only sees an
          update once you assign one to it - nothing is pushed fleet-wide by default.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Upload form */}
      <form onSubmit={handleUpload} className="bg-white rounded-xl border border-gray-200 shadow-card p-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-semibold text-ink-dim mb-1.5">Version</label>
          <input
            required
            placeholder="e.g. 1.0.3"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-600"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-dim mb-1.5">firmware.bin</label>
          <input
            required
            type="file"
            accept=".bin"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isUploading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg font-bold text-sm hover:brightness-105 transition disabled:opacity-60"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? "Uploading…" : "Upload"}
        </button>
      </form>

      {/* Firmware list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-ink-dim text-xs uppercase tracking-wider">
            <tr>
              <th className="py-4 px-6 font-semibold">Version</th>
              <th className="py-4 px-6 font-semibold">Size</th>
              <th className="py-4 px-6 font-semibold">SHA256</th>
              <th className="py-4 px-6 font-semibold">Targeted devices</th>
              <th className="py-4 px-6 font-semibold">Uploaded</th>
              <th className="py-4 px-6 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="py-8 text-center text-ink-dim">Loading…</td></tr>
            ) : firmware.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-ink-dim">No firmware uploaded yet.</td></tr>
            ) : (
              firmware.map((fw) => (
                <tr key={fw.id} className="hover:bg-gray-50">
                  <td className="py-3 px-6 font-bold">{fw.version}</td>
                  <td className="py-3 px-6 text-ink-dim">{(fw.size / 1024).toFixed(1)} KB</td>
                  <td className="py-3 px-6 font-mono text-xs text-ink-dim">{fw.sha256.slice(0, 12)}…</td>
                  <td className="py-3 px-6">{fw._count.devices}</td>
                  <td className="py-3 px-6 text-ink-dim">{new Date(fw.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setAssignTarget(fw);
                          setSelectedDeviceIds([]);
                        }}
                        className="p-1.5 text-brand-700 bg-brand-50 rounded hover:bg-brand-100"
                        title="Assign to devices"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(fw.id)}
                        className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assign modal */}
      {assignTarget && (
        <div className="modal-backdrop" onClick={() => setAssignTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-dim">
                Assign v{assignTarget.version} to devices
              </p>
              <button onClick={() => setAssignTarget(null)} className="text-ink-dim hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1 border border-gray-100 rounded-lg p-2">
              {devices.map((d) => (
                <label key={d.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDeviceIds.includes(d.id)}
                    onChange={(e) =>
                      setSelectedDeviceIds(
                        e.target.checked
                          ? [...selectedDeviceIds, d.id]
                          : selectedDeviceIds.filter((id) => id !== d.id)
                      )
                    }
                  />
                  {d.deviceName || d.deviceUid}{" "}
                  <span className="text-ink-dim text-xs">(running {d.firmwareVersion || "unknown"})</span>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                onClick={() => setAssignTarget(null)}
                className="bg-transparent border border-gray-200 px-4 py-2 rounded-lg hover:border-brand-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={isAssigning || selectedDeviceIds.length === 0}
                className="bg-brand-600 text-white font-bold px-4 py-2 rounded-lg hover:brightness-105 disabled:opacity-60"
              >
                {isAssigning ? "Assigning…" : `Assign to ${selectedDeviceIds.length} device(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
