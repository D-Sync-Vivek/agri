import { Router } from "express";
import * as authController from "../controllers/authController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// Mirrors app.include_router(auth_router.router, tags=["Authentication"]) - no prefix.
router.post("/register", asyncHandler(authController.register));
router.post("/login", asyncHandler(authController.login));
router.post("/logout", asyncHandler(authController.logout));
router.get("/checkSession", requireAuth, requireRole("user", "admin"), asyncHandler(authController.checkSession));

export default router;
