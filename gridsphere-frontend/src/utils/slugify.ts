/**
 * "Wind Speed" -> "wind_speed". Mirrors the backend's slugify
 * (src/utils/slugify.ts in gridsphere-node) exactly, so the preview shown
 * here always matches what the server will actually store - this is
 * display-only, the real label is computed server-side in
 * sensorController.installDeviceSensor, never trusted from the client.
 */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

