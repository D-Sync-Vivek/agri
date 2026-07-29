import { Router } from "express";
import * as cropController from "../controllers/cropController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// Reading the crop list is public, same pattern as GET /sensors/types.
router.get("/", asyncHandler(cropController.listCrops));
// Adding a crop is a write, so it requires auth (matches every other
// write route in the app) even though the resulting crop is shared/global.
router.post("/", requireAuth, requireRole("user"), asyncHandler(cropController.createCrop));

export default router;
