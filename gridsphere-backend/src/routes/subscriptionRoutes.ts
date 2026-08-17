import { Router } from "express";
import * as subscriptionController from "../controllers/subscriptionController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// Mirrors app.include_router(subscription_router.router, prefix="/subscriptions", tags=["Subscriptions"])
router.get("/plans", asyncHandler(subscriptionController.getAvailablePlans));
router.get("/devices", requireAuth, requireRole("user", "admin"), asyncHandler(subscriptionController.getMyDevicesWithSubscriptions));
router.get("/device/:device_id", requireAuth, requireRole("user", "admin"), asyncHandler(subscriptionController.getDeviceSubscription));
router.post("/checkout", requireAuth, requireRole("user", "admin"), asyncHandler(subscriptionController.createCheckout));
router.post("/verify", requireAuth, requireRole("user", "admin"), asyncHandler(subscriptionController.verifyPayment));

export default router;

