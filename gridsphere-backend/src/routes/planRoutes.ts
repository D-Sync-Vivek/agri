import { Router } from "express";
import * as planController from "../controllers/planController";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

router.get("/", requireAuth, asyncHandler(planController.getPlan));

export default router;


