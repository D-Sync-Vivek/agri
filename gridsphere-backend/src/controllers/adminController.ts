// src/controllers/adminController.ts
import { Request, Response } from "express";
import { AdminService } from "../services/adminService";
import {
  AdminDeviceCreateSchema,
  AdminDeviceAssignSchema,
  AdminDeviceUnassignSchema,
  AdminUserUpdateSchema,
} from "../schemas/adminSchema";

const adminService = new AdminService();

// ===== DEVICE ENDPOINTS =====

export async function adminCreateDevice(req: Request, res: Response) {
  const data = AdminDeviceCreateSchema.parse(req.body);
  const device = await adminService.createDevice(data);
  res.status(201).json({ status: "success", data: device });
}

export async function adminListDevices(req: Request, res: Response) {
  const devices = await adminService.getAllDevices();
  res.status(200).json({ status: "success", data: devices });
}

export async function adminGetDevice(req: Request, res: Response) {
  const deviceId = parseInt(req.params.device_id, 10);
  const device = await adminService.getDeviceDetails(deviceId);
  res.status(200).json({ status: "success", data: device });
}

export async function adminUpdateDevice(req: Request, res: Response) {
  const deviceId = parseInt(req.params.device_id, 10);
  const data = AdminDeviceCreateSchema.partial().parse(req.body);
  const device = await adminService.updateDevice(deviceId, data);
  res.status(200).json({ status: "success", data: device });
}

export async function adminDeleteDevice(req: Request, res: Response) {
  const deviceId = parseInt(req.params.device_id, 10);
  const result = await adminService.deleteDevice(deviceId);
  res.status(200).json({ status: "success", ...result });
}

export async function adminAssignDevice(req: Request, res: Response) {
  const deviceId = parseInt(req.params.device_id, 10);
  const data = AdminDeviceAssignSchema.parse(req.body);
  const result = await adminService.assignDeviceToUser(deviceId, data);
  res.status(200).json({ status: "success", data: result });
}

export async function adminUnassignDevice(req: Request, res: Response) {
  const deviceId = parseInt(req.params.device_id, 10);
  const data = AdminDeviceUnassignSchema.parse(req.body);
  const result = await adminService.unassignDeviceFromUser(deviceId, data);
  res.status(200).json({ status: "success", ...result });
}

// ===== USER ENDPOINTS =====

export async function adminListUsers(req: Request, res: Response) {
  const users = await adminService.getAllUsers();
  res.status(200).json({ status: "success", data: users });
}

export async function adminGetUser(req: Request, res: Response) {
  const userId = parseInt(req.params.user_id, 10);
  const user = await adminService.getUserDetails(userId);
  res.status(200).json({ status: "success", data: user });
}

export async function adminUpdateUser(req: Request, res: Response) {
  const userId = parseInt(req.params.user_id, 10);
  const data = AdminUserUpdateSchema.parse(req.body);
  const user = await adminService.updateUser(userId, data);
  res.status(200).json({ status: "success", data: user });
}

export async function adminDeleteUser(req: Request, res: Response) {
  const userId = parseInt(req.params.user_id, 10);
  const result = await adminService.deleteUser(userId);
  res.status(200).json({ status: "success", ...result });
}

// ===== SYSTEM STATS =====

export async function adminGetStats(req: Request, res: Response) {
  const stats = await adminService.getSystemStats();
  res.status(200).json({ status: "success", data: stats });
}