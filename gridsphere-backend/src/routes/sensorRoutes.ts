import { Router } from "express";
import * as sensorController from "../controllers/sensorController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// Mirrors app.include_router(sensor_router.router, prefix="/sensors", tags=["Sensors"])
router.get("/types", asyncHandler(sensorController.getSensorTypes));
router.post("/types", asyncHandler(sensorController.createSensorType));

router.get("/device/:device_id", requireAuth, requireRole("user", "admin"), asyncHandler(sensorController.getDeviceSensors));
router.post("/device", requireAuth, requireRole("user", "admin"), asyncHandler(sensorController.installDeviceSensor));
router.patch("/device/sensor/:device_sensor_id", requireAuth, requireRole("user", "admin"), asyncHandler(sensorController.updateDeviceSensor));

export default router;
