import { Router } from "express";
import * as firmwareController from "../controllers/firmwareController";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// No auth - ESP32 devices hit these directly, same as the original
// standalone firmware server (ota.txt), just with ?device_id= targeting.
router.get("/version", asyncHandler(firmwareController.getFirmwareVersion));
router.get("/download", asyncHandler(firmwareController.downloadFirmware));

export default router;
