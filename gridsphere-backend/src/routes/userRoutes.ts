import { Router } from "express";
import * as userController from "../controllers/userController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// Mirrors app.include_router(user_router.router, prefix="/users", tags=["Users"])
router.get("/", requireAuth, requireRole("user", "admin"), asyncHandler(userController.getUser));

export default router;


