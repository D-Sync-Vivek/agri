// src/services/adminService.ts
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { withEffectiveStatus } from "../utils/deviceStatus";
import {
  AdminDeviceCreate,
  AdminDeviceAssign,
  AdminDeviceUnassign,
  AdminUserUpdate,
} from "../schemas/adminSchema";

export class AdminService {
  // ===== DEVICE MANAGEMENT =====

  async createDevice(data: AdminDeviceCreate) {
    const existing = await prisma.device.findUnique({
      where: { deviceUid: data.device_uid },
    });
    if (existing) {
      throw new ApiError(
        400,
        `Device with UID "${data.device_uid}" already exists`,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const device = await tx.device.create({
        data: {
          deviceUid: data.device_uid,
          deviceName: data.device_name ?? undefined,
          description: data.description ?? undefined,
          frequency: data.frequency,
          locationName: data.location_name ?? undefined,
          latitude: data.latitude ?? undefined,
          longitude: data.longitude ?? undefined,
          simNumber: data.sim_number ?? undefined,
          imei: data.imei ?? undefined,
          installationDate: data.installation_date ? new Date(data.installation_date) : undefined,
        },
      });

      if (data.assign_to_user_id) {
        const user = await tx.user.findUnique({
          where: { id: data.assign_to_user_id },
        });
        if (!user) {
          throw new ApiError(
            404,
            `User with ID ${data.assign_to_user_id} not found`,
          );
        }

        await tx.deviceUser.create({
          data: {
            userId: data.assign_to_user_id,
            deviceId: device.id,
            isOwner: false,
            role: "viewer",
          },
        });
      }

      return device;
    });

    return withEffectiveStatus(result);
  }

  async getAllDevices() {
    const devices = await prisma.device.findMany({
      include: {
        userAssociations: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        crop: true,
        sensors: { where: { isActive: true } },
        subscriptions: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return devices.map((d) => {
      const activeSubs = d.subscriptions.filter((s) => s.status === "active");
      return {
        ...withEffectiveStatus(d),
        users: d.userAssociations.map((ua) => ({
          id: ua.user.id,
          name: ua.user.name,
          email: ua.user.email,
          role: ua.role,
          isOwner: ua.isOwner,
          hasActiveSubscription: activeSubs.some(
            (s) => s.userId === ua.user.id,
          ),
        })),
        sensorCount: d.sensors.length,
        activeSubscriptionCount: activeSubs.length, // NEW
      };
    });
  }

  async getDeviceDetails(deviceId: number) {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        userAssociations: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
        crop: true,
        sensors: { include: { sensorType: true } },
        subscriptions: { include: { plan: true } },
      },
    });

    if (!device) throw new ApiError(404, "Device not found");

    const activeSubs = device.subscriptions.filter(
      (s) => s.status === "active",
    );

    return {
      ...withEffectiveStatus(device),
      users: device.userAssociations.map((ua) => ({
        id: ua.user.id,
        name: ua.user.name,
        email: ua.user.email,
        phone: ua.user.phone,
        role: ua.role,
        isOwner: ua.isOwner,
        hasActiveSubscription: activeSubs.some((s) => s.userId === ua.user.id),
      })),
      sensors: device.sensors,
      subscriptions: device.subscriptions,
    };
  }

  async assignDeviceToUser(deviceId: number, data: AdminDeviceAssign) {
    const [device, user] = await Promise.all([
      prisma.device.findUnique({ where: { id: deviceId } }),
      prisma.user.findUnique({ where: { id: data.user_id } }),
    ]);

    if (!device) throw new ApiError(404, "Device not found");
    if (!user) throw new ApiError(404, "User not found");

    const existing = await prisma.deviceUser.findFirst({
      where: {
        deviceId,
        userId: data.user_id,
      },
    });

    if (existing) {
      throw new ApiError(400, "User is already associated with this device");
    }

    const result = await prisma.deviceUser.create({
      data: {
        deviceId,
        userId: data.user_id,
        role: data.role,
        isOwner: data.role === "owner",
      },
    });

    return result;
  }

  async unassignDeviceFromUser(deviceId: number, data: AdminDeviceUnassign) {
    const association = await prisma.deviceUser.findFirst({
      where: {
        deviceId,
        userId: data.user_id,
      },
    });

    if (!association) {
      throw new ApiError(404, "User is not associated with this device");
    }

    // Prevent removing the last owner
    if (association.isOwner) {
      const ownerCount = await prisma.deviceUser.count({
        where: {
          deviceId,
          isOwner: true,
        },
      });

      if (ownerCount <= 1) {
        throw new ApiError(400, "Cannot remove the last owner of a device");
      }
    }

    await prisma.deviceUser.delete({
      where: { id: association.id },
    });

    return { message: "User unassigned from device" };
  }

  async updateDevice(deviceId: number, data: Partial<AdminDeviceCreate>) {
    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new ApiError(404, "Device not found");

    // Check UID uniqueness if changing
    if (data.device_uid && data.device_uid !== device.deviceUid) {
      const existing = await prisma.device.findUnique({
        where: { deviceUid: data.device_uid },
      });
      if (existing) {
        throw new ApiError(
          400,
          `Device with UID "${data.device_uid}" already exists`,
        );
      }
    }

    const updated = await prisma.device.update({
      where: { id: deviceId },
      data: {
        deviceUid: data.device_uid,
        deviceName: data.device_name ?? undefined,
        description: data.description ?? undefined,
        frequency: data.frequency,
        locationName: data.location_name ?? undefined,
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
        simNumber: data.sim_number ?? undefined,
        imei: data.imei ?? undefined,
        installationDate: data.installation_date ? new Date(data.installation_date) : undefined,
      },
    });

    return withEffectiveStatus(updated);
  }

  async deleteDevice(deviceId: number) {
    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new ApiError(404, "Device not found");

    await prisma.$transaction(async (tx) => {
      // 1. Get all sensor IDs for this device
      const sensors = await tx.deviceSensor.findMany({
        where: { deviceId },
        select: { id: true },
      });
      const sensorIds = sensors.map((s) => s.id);

      // 2. Delete sensor readings (they reference device_sensors)
      if (sensorIds.length > 0) {
        await tx.sensorReading.deleteMany({
          where: { deviceSensorId: { in: sensorIds } },
        });

        // 3. Delete device sensor history (references device_sensors, but ON DELETE SET NULL – we delete anyway)
        await tx.deviceSensorHistory.deleteMany({
          where: { deviceSensorId: { in: sensorIds } },
        });
      }

      // 4. Delete device sensors
      await tx.deviceSensor.deleteMany({ where: { deviceId } });

      // 5. Delete raw payloads (references devices – ON DELETE SET NULL, but we can delete them)
      await tx.rawPayload.deleteMany({ where: { deviceId } });

      // 6. Delete chat messages
      await tx.deviceChatMessage.deleteMany({ where: { deviceId } });

      // 7. Delete advisories
      await tx.deviceAdvisory.deleteMany({ where: { deviceId } });

      // 8. Delete subscriptions
      await tx.deviceSubscription.deleteMany({ where: { deviceId } });

      // 9. Delete user associations
      await tx.deviceUser.deleteMany({ where: { deviceId } });

      // 10. Finally, delete the device itself
      await tx.device.delete({ where: { id: deviceId } });
    });

    return { message: "Device deleted successfully" };
  }

  // ===== USER MANAGEMENT =====

  async getAllUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            deviceAssociations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map((u) => ({
      ...u,
      deviceCount: u._count.deviceAssociations,
    }));
  }

  async getUserDetails(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        deviceAssociations: {
          include: {
            device: {
              include: {
                sensors: { where: { isActive: true } },
                subscriptions: {
                  include: {
                    plan: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) throw new ApiError(404, "User not found");

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      companyName: user.companyName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      devices: user.deviceAssociations.map((da) => {
        // Find the active subscription for this user-device pair
        const activeSub = da.device.subscriptions.find(
          (s) => s.userId === userId && s.status === "active",
        );
        return {
          id: da.device.id,
          deviceUid: da.device.deviceUid,
          deviceName: da.device.deviceName,
          status: da.device.status,
          lastSeenAt: da.device.lastSeenAt,
          role: da.role,
          isOwner: da.isOwner,
          sensorCount: da.device.sensors.length,
          subscription: activeSub
            ? {
                planName: activeSub.plan?.planName || null,
                endDate: activeSub.endDate,
                status: activeSub.status,
              }
            : null,
        };
      }),
    };
  }

  async updateUser(userId: number, data: AdminUserUpdate) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, "User not found");

    // Prevent admin from demoting themselves
    if (data.role === "user" && userId === 1) {
      // Check if this is the default admin (or use a better check)
      throw new ApiError(400, "Cannot demote the primary admin account");
    }

    // Check email uniqueness
    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        throw new ApiError(
          400,
          `User with email "${data.email}" already exists`,
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: data.is_active,
      },
    });

    return updated;
  }

  async deleteUser(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, "User not found");

    // Prevent deleting the primary admin
    if (userId === 1) {
      throw new ApiError(400, "Cannot delete the primary admin account");
    }

    // Check if user owns any devices
    const ownedDevices = await prisma.deviceUser.count({
      where: {
        userId,
        isOwner: true,
      },
    });

    if (ownedDevices > 0) {
      // Option 1: Delete the user (cascade)
      // Option 2: Reassign devices first
      // We'll allow deletion and let Prisma cascade
    }

    await prisma.user.delete({ where: { id: userId } });
    return { message: "User deleted successfully" };
  }

  // ===== SYSTEM STATS =====

  async getSystemStats() {
    const [
      totalUsers,
      activeUsers,
      totalDevices,
      onlineDevices,
      totalReadings,
      totalSensors,
      totalCrops,
      totalSubscriptions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.device.count(),
      prisma.device.count({ where: { status: "active" } }),
      prisma.sensorReading.count(),
      prisma.deviceSensor.count({ where: { isActive: true } }),
      prisma.crop.count(),
      prisma.deviceSubscription.count({ where: { status: "active" } }),
    ]);

    // Recent activity (last 24 hours)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [readings24h, newDevices24h, newUsers24h] = await Promise.all([
      prisma.sensorReading.count({ where: { recordedAt: { gte: last24h } } }),
      prisma.device.count({ where: { createdAt: { gte: last24h } } }),
      prisma.user.count({ where: { createdAt: { gte: last24h } } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newLast24h: newUsers24h,
      },
      devices: {
        total: totalDevices,
        online: onlineDevices,
        newLast24h: newDevices24h,
      },
      readings: {
        total: totalReadings,
        last24h: readings24h,
      },
      sensors: {
        installed: totalSensors,
      },
      crops: totalCrops,
      subscriptions: totalSubscriptions,
    };
  }
}


