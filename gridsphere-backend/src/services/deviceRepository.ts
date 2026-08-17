import prisma from "../config/prisma";

/**
 * NOTE: In the original Python project, app/repositories/device_repo.py
 * defined `create_user_device`, but it referenced fields (u_id, farm_name,
 * address, industry_type) that belonged to an OLDER version of the Device
 * model - not the current one used by device_router.py (which builds
 * `Device(**device_in.model_dump())` directly and never calls this repo
 * function). It was effectively dead/stale code. We keep an updated,
 * working equivalent here in case it's needed, matching the CURRENT
 * Device schema instead of the stale one.
 */
export async function createUserDevice(
  deviceUid: string,
  deviceName: string | null | undefined,
  description: string | null | undefined,
  frequency: number,
  locationName: string | null | undefined,
  latitude: number | null | undefined,
  longitude: number | null | undefined
) {
  return prisma.device.create({
    data: {
      deviceUid,
      deviceName: deviceName ?? undefined,
      description: description ?? undefined,
      frequency,
      locationName: locationName ?? undefined,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
    },
  });
}


