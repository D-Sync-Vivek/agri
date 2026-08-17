-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "phone" TEXT,
    "company_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" SERIAL NOT NULL,
    "device_uid" TEXT NOT NULL,
    "device_name" TEXT,
    "description" TEXT,
    "frequency" INTEGER NOT NULL DEFAULT 5,
    "location_name" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "installation_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_users" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "device_id" INTEGER NOT NULL,
    "role" TEXT,
    "permissions" JSONB,
    "is_owner" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "code" TEXT,
    "unit" TEXT,
    "data_type" TEXT,
    "category" TEXT,
    "min_value" DOUBLE PRECISION,
    "max_value" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_sensors" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "sensor_type_id" INTEGER NOT NULL,
    "sensor_label" TEXT,
    "hardware_port" TEXT,
    "calibration_offset" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "calibration_scale" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "installed_at" TIMESTAMP(3),
    "removed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_sensors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_readings" (
    "id" SERIAL NOT NULL,
    "device_sensor_id" INTEGER NOT NULL,
    "value" DOUBLE PRECISION,
    "quality_flag" TEXT,
    "recorded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_payloads" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER,
    "payload_json" JSONB,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_payloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_sensor_history" (
    "id" SERIAL NOT NULL,
    "device_sensor_id" INTEGER,
    "action" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "performed_by" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_sensor_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" SERIAL NOT NULL,
    "plan_name" TEXT,
    "plan_code" TEXT,
    "price_monthly" DECIMAL(10,2),
    "price_yearly" DECIMAL(10,2),
    "max_devices" INTEGER,
    "max_sensors_per_device" INTEGER,
    "data_retention_days" INTEGER,
    "features_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_subscriptions" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER,
    "plan_id" INTEGER,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "billing_cycle" TEXT,
    "price_paid" DECIMAL(10,2),
    "status" TEXT,
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "devices_device_uid_key" ON "devices"("device_uid");

-- CreateIndex
CREATE INDEX "device_users_user_id_idx" ON "device_users"("user_id");

-- CreateIndex
CREATE INDEX "device_users_device_id_idx" ON "device_users"("device_id");

-- CreateIndex
CREATE UNIQUE INDEX "sensor_types_code_key" ON "sensor_types"("code");

-- CreateIndex
CREATE INDEX "device_sensors_device_id_idx" ON "device_sensors"("device_id");

-- CreateIndex
CREATE INDEX "device_sensors_sensor_type_id_idx" ON "device_sensors"("sensor_type_id");

-- CreateIndex
CREATE INDEX "sensor_readings_device_sensor_id_idx" ON "sensor_readings"("device_sensor_id");

-- CreateIndex
CREATE INDEX "sensor_readings_recorded_at_idx" ON "sensor_readings"("recorded_at");

-- CreateIndex
CREATE INDEX "raw_payloads_device_id_idx" ON "raw_payloads"("device_id");

-- CreateIndex
CREATE INDEX "raw_payloads_received_at_idx" ON "raw_payloads"("received_at");

-- CreateIndex
CREATE INDEX "device_sensor_history_device_sensor_id_idx" ON "device_sensor_history"("device_sensor_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_plan_code_key" ON "subscription_plans"("plan_code");

-- CreateIndex
CREATE INDEX "device_subscriptions_device_id_idx" ON "device_subscriptions"("device_id");

-- CreateIndex
CREATE INDEX "device_subscriptions_plan_id_idx" ON "device_subscriptions"("plan_id");

-- AddForeignKey
ALTER TABLE "device_users" ADD CONSTRAINT "device_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_users" ADD CONSTRAINT "device_users_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_sensors" ADD CONSTRAINT "device_sensors_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_sensors" ADD CONSTRAINT "device_sensors_sensor_type_id_fkey" FOREIGN KEY ("sensor_type_id") REFERENCES "sensor_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_device_sensor_id_fkey" FOREIGN KEY ("device_sensor_id") REFERENCES "device_sensors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_payloads" ADD CONSTRAINT "raw_payloads_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_sensor_history" ADD CONSTRAINT "device_sensor_history_device_sensor_id_fkey" FOREIGN KEY ("device_sensor_id") REFERENCES "device_sensors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_sensor_history" ADD CONSTRAINT "device_sensor_history_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_subscriptions" ADD CONSTRAINT "device_subscriptions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_subscriptions" ADD CONSTRAINT "device_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;


