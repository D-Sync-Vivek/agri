-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "crop_id" INTEGER;

-- CreateTable
CREATE TABLE "crops" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_advisories" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "crop_id" INTEGER,
    "summary" TEXT NOT NULL,
    "precautions" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "model_name" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_advisories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crops_code_key" ON "crops"("code");

-- CreateIndex
CREATE INDEX "device_advisories_device_id_idx" ON "device_advisories"("device_id");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "crops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_advisories" ADD CONSTRAINT "device_advisories_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_advisories" ADD CONSTRAINT "device_advisories_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "crops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
