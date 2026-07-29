import { Router } from "express";
import * as deviceController from "../controllers/deviceController";
import * as cropController from "../controllers/cropController";
import * as advisoryController from "../controllers/advisoryController";
import * as chatController from "../controllers/chatController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// Mirrors app.include_router(device_router.router, prefix="/devices", tags=["Devices"])
router.post("/", requireAuth, requireRole("user", "admin"), asyncHandler(deviceController.createDevice));
router.get("/", requireAuth, requireRole("user", "admin"), asyncHandler(deviceController.getMyDevices));
router.get("/:device_id/live-data", requireAuth, requireRole("user", "admin"), asyncHandler(deviceController.getLiveData));
router.get("/:device_id/history", requireAuth, requireRole("user", "admin"), asyncHandler(deviceController.getDeviceHistory));
router.get("/:device_id/industry", requireAuth, requireRole("user", "admin"), asyncHandler(deviceController.getIndustryType));
router.post("/:device_id/industry", requireAuth, requireRole("user", "admin"), asyncHandler(deviceController.updateIndustryType));
router.get("/:device_id/forecast", requireAuth, requireRole("user", "admin"), asyncHandler(deviceController.getForecast));
router.get("/:device_id/insights", requireAuth, requireRole("user", "admin"), asyncHandler(deviceController.getInsights));
router.get("/:device_id/history/export", requireAuth, requireRole("user", "admin"), asyncHandler(deviceController.exportHistoryCsv));
router.post("/:device_id/crop", requireAuth, requireRole("user", "admin"), asyncHandler(cropController.setDeviceCrop));
router.get("/:device_id/advisory", requireAuth, requireRole("user", "admin"), asyncHandler(advisoryController.getAdvisory));
router.get("/:device_id/wind-analytics", requireAuth, requireRole("user", "admin"), asyncHandler(deviceController.getWindAnalyticsHandler));
router.get("/:device_id/rain-analytics", requireAuth, requireRole("user", "admin"), asyncHandler(deviceController.getRainAnalyticsHandler));
router.post("/:device_id/chat", requireAuth, requireRole("user", "admin"), asyncHandler(chatController.sendChatMessage));
router.get("/:device_id/chat", requireAuth, requireRole("user", "admin"), asyncHandler(chatController.getChatHistory));

export default router;
