// src/routes/adminRoutes.ts
import { Router } from "express";
import * as adminController from "../controllers/adminController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { asyncHandler } from "../middleware/errorHandler";

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
export default router;