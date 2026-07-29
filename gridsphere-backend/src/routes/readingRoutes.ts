import { Router } from "express";
import * as readingController from "../controllers/readingController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// Mirrors app.include_router(reading_router.router, prefix="/readings", tags=["Readings"])
// NOTE: /add is intentionally public (no auth) - matches the original,
// since IoT devices call it directly without a user JWT.
router.get("/add", asyncHandler(readingController.addReading));
router.get("/:d_id/history", requireAuth, requireRole("user", "admin"), asyncHandler(readingController.getDeviceHistory));

export default router;
