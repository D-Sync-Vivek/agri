import fs from "fs";
import path from "path";
import crypto from "crypto";

// Mount a persistent volume at this path in production (same caveat as
// the original standalone firmware server - files here don't survive a
// container rebuild unless this directory is a mounted volume).
export const FIRMWARE_DIR = process.env.FIRMWARE_DIR || path.join(process.cwd(), "data", "firmware");

export function ensureFirmwareDir() {
  fs.mkdirSync(FIRMWARE_DIR, { recursive: true });
}

export function sha256File(filePath: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

export function firmwarePath(filename: string): string {
  return path.join(FIRMWARE_DIR, filename);
}
