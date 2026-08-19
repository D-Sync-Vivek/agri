import { Router } from "express";
import multer from "multer";
import * as adminController from "../controllers/adminController";
import * as adminFirmwareController from "../controllers/adminFirmwareController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { asyncHandler } from "../middleware/errorHandler";

const firmwareUpload = multer({ dest: "/tmp/firmware-uploads" });

const router = Router();

// All admin routes require authentication + admin role
router.use(requireAuth, requireRole("admin"));

// ===== DEVICE MANAGEMENT =====
router.post("/devices", asyncHandler(adminController.adminCreateDevice));
router.get("/devices", asyncHandler(adminController.adminListDevices));
router.get("/devices/:device_id", asyncHandler(adminController.adminGetDevice));
router.put("/devices/:device_id", asyncHandler(adminController.adminUpdateDevice));
router.delete("/devices/:device_id", asyncHandler(adminController.adminDeleteDevice));

// ===== DEVICE ASSIGNMENT =====
router.post("/devices/:device_id/assign", asyncHandler(adminController.adminAssignDevice));
router.delete("/devices/:device_id/assign", asyncHandler(adminController.adminUnassignDevice));

// ===== USER MANAGEMENT =====
router.get("/users", asyncHandler(adminController.adminListUsers));
router.get("/users/:user_id", asyncHandler(adminController.adminGetUser));
router.put("/users/:user_id", asyncHandler(adminController.adminUpdateUser));
router.delete("/users/:user_id", asyncHandler(adminController.adminDeleteUser));

// ===== SYSTEM STATS =====
router.get("/stats", asyncHandler(adminController.adminGetStats));
router.get("/deepseek/status", asyncHandler(adminController.checkDeepSeekStatus));
router.get("/deepseek/balance", asyncHandler(adminController.getDeepSeekBalanceHandler));

// ==== COUPON ======= 
router.post("/coupons", asyncHandler(adminController.createCoupon));
router.get("/coupons", asyncHandler(adminController.listCoupons));
router.delete("/coupons/:coupon_id", asyncHandler(adminController.revokeCoupon));

// ==== FIRMWARE (OTA) =======
router.post("/firmware", firmwareUpload.single("file"), asyncHandler(adminFirmwareController.uploadFirmware));
router.get("/firmware", asyncHandler(adminFirmwareController.listFirmware));
router.delete("/firmware/:id", asyncHandler(adminFirmwareController.deleteFirmware));
router.post("/firmware/:id/assign", asyncHandler(adminFirmwareController.assignFirmware));
router.post("/firmware/unassign", asyncHandler(adminFirmwareController.unassignFirmware));

export default router;

