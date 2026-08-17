-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "battery_level" DOUBLE PRECISION,
ADD COLUMN     "firmware_version" TEXT,
ADD COLUMN     "is_solar_charging" BOOLEAN,
ADD COLUMN     "signal_strength_dbm" INTEGER;


