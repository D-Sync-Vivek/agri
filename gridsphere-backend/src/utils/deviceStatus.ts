/**
 * A device's real-world connectivity state has to be *derived*, not
 * stored - "active" only ever gets written by the ingestion endpoint
 * (readingController.addReading) when data actually arrives, and nothing
 * ever flips it back if the device goes quiet. Left as a stored flag,
 * every device would show "Online" forever after its very first reading.
 *
 * Rule (per product): a device is considered offline if it hasn't sent
 * data within (frequency_minutes * 2). E.g. a device reporting every 5
 * minutes is marked offline if nothing's arrived in the last 10 minutes -
 * one missed cycle is tolerated (network hiccup, brief power blip), two
 * in a row means something's actually wrong.
 *
 * Three effective states, not two:
 *  - "inactive" - never sent a single reading (lastSeenAt is null).
 *    Distinct from "offline" so the UI can say "not yet connected"
 *    instead of implying something that used to work has broken.
 *  - "active"   - a reading arrived within the last frequency*2 minutes.
 *  - "offline"  - it has reported before, but not recently enough.
 */
export type EffectiveDeviceStatus = "inactive" | "active" | "offline";

export function computeEffectiveDeviceStatus(device: {
  lastSeenAt: Date | null;
  frequency: number;
}): EffectiveDeviceStatus {
  if (!device.lastSeenAt) {
    return "inactive";
  }

  const thresholdMinutes = device.frequency * 2;
  const ageMinutes = (Date.now() - device.lastSeenAt.getTime()) / 60000;

  return ageMinutes > thresholdMinutes ? "offline" : "active";
}

/**
 * Returns a shallow copy of a device row with `status` overwritten by the
 * computed effective status, for anywhere a Device gets sent to the
 * client. The raw `status` column in the DB is left alone (still useful
 * as "was this device ever successfully ingesting as of its last write"),
 * this only affects what callers see.
 */
export function withEffectiveStatus<T extends { lastSeenAt: Date | null; frequency: number; status: string }>(
  device: T
): T {
  return { ...device, status: computeEffectiveDeviceStatus(device) };
}


