/// <reference types="node" />
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Equivalent of data_link.py -> connect_dummy_data
 * Links (or creates) a device with id 1 to a user, so that dummy/
 * simulator sensor readings have an owner to attach to.
 *
 * Which user: set SEED_USER_EMAIL to target a specific one
 * (e.g. `SEED_USER_EMAIL=jane@example.com npx prisma db seed`). If unset,
 * falls back to whichever user happens to be first in the table - fine
 * for a fresh dev DB with one user, but not what you want once you have
 * more than one.
 */
async function connectDummyData() {
  const targetEmail = process.env.SEED_USER_EMAIL;

  const myUser = targetEmail
    ? await prisma.user.findUnique({ where: { email: targetEmail } })
    : await prisma.user.findFirst();

  if (!myUser) {
    if (targetEmail) {
      console.log(`No user found with email "${targetEmail}". Register that user first, or check for typos.`);
    } else {
      console.log("No users found! Please register a user first.");
    }
    return;
  }

  const device = await prisma.device.findFirst({ where: { id: 1 } });

  if (!device) {
    console.log(`Creating Device 1 and linking it to User: ${myUser.email}`);
    const newDevice = await prisma.device.create({
      data: {
        id: 1,
        deviceUid: "dummy-simulator-hub",
        deviceName: "Dummy Simulator Hub",
      },
    });
    await prisma.deviceUser.create({
      data: {
        userId: myUser.id,
        deviceId: newDevice.id,
        isOwner: true,
        role: "owner",
      },
    });
    console.log("Success! Dummy readings are now connected to your user.");
  } else {
    console.log(`Device 1 exists. Ensuring ownership by User: ${myUser.email}`);
    const existingLink = await prisma.deviceUser.findFirst({
      where: { deviceId: device.id, userId: myUser.id },
    });
    if (!existingLink) {
      await prisma.deviceUser.create({
        data: { userId: myUser.id, deviceId: device.id, isOwner: true, role: "owner" },
      });
    }
    console.log("Success! Ownership updated.");
  }
}

/**
 * Seeds the crop reference table. Only mango and apple are supported for
 * now (see the assignment) - add more rows here as crop support grows.
 * Uses upsert so re-running the seed is safe.
 */
async function seedCrops() {
  const crops = [
    { name: "Mango", code: "mango" },
    { name: "Apple", code: "apple" },
  ];

  for (const crop of crops) {
    await prisma.crop.upsert({
      where: { code: crop.code },
      update: { name: crop.name },
      create: crop,
    });
  }
  console.log("Success! Crops seeded: mango, apple.");
}

/**
 * Seeds sensor_types for every metric this app knows how to display
 * nicely (see frontend src/utils/metrics.tsx), including the ones added
 * for wind direction / air quality / leaf wetness / soil temperature.
 * Uses upsert so it's safe to re-run. Users still install a device_sensor
 * pointing at one of these (POST /sensors/device) before readings for it
 * are accepted - this just means they don't have to also create the
 * sensor_type by hand first via POST /sensors/types.
 */
async function seedSensorTypes() {
  const sensorTypes = [
    { name: "Air Temperature", code: "temp", unit: "°C", dataType: "float", category: "weather" },
    { name: "Humidity", code: "humidity", unit: "%", dataType: "float", category: "weather" },
    { name: "Light Intensity", code: "light_intensity", unit: "lx", dataType: "float", category: "weather" },
    { name: "Wind Speed", code: "wind_speed", unit: "m/s", dataType: "float", category: "wind" },
    { name: "Wind Direction", code: "wind_direction", unit: "°", dataType: "float", category: "wind" },
    { name: "Atmospheric Pressure", code: "pressure", unit: "hPa", dataType: "float", category: "weather" },
    { name: "Rainfall", code: "rainfall", unit: "mm", dataType: "float", category: "weather" },
    { name: "Soil Moisture", code: "soil_moisture", unit: "%", dataType: "float", category: "soil" },
    { name: "Soil Temperature", code: "soil_temp", unit: "°C", dataType: "float", category: "soil" },
    { name: "Solar Radiation", code: "solar_radiation", unit: "W/m²", dataType: "float", category: "solar" },
    { name: "UV Index", code: "uv_index", unit: "", dataType: "float", category: "solar" },
    { name: "Leaf Wetness", code: "leaf_wetness", unit: "%", dataType: "float", category: "leaf" },
    { name: "PM1", code: "pm1", unit: "µg/m³", dataType: "float", category: "air_quality" },
    { name: "PM2.5", code: "pm2_5", unit: "µg/m³", dataType: "float", category: "air_quality" },
    { name: "PM10", code: "pm10", unit: "µg/m³", dataType: "float", category: "air_quality" },
    { name: "CO2", code: "co2", unit: "ppm", dataType: "float", category: "air_quality" },
    { name: "TVOC", code: "tvoc", unit: "ppb", dataType: "float", category: "air_quality" },
    { name: "BMP Temperature", code: "bmp_temp", unit: "°C", dataType: "float", category: "weather" },
    { name: "Altitude", code: "altitude", unit: "m", dataType: "float", category: "location" },
  ];

  for (const st of sensorTypes) {
    await prisma.sensorType.upsert({
      where: { code: st.code },
      update: { name: st.name, unit: st.unit, dataType: st.dataType, category: st.category },
      create: st,
    });
  }
  console.log(`Success! Seeded ${sensorTypes.length} sensor types.`);
}

/**
 * Seeds the admin user (or creates if doesn't exist)
 */
async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@gridsphere.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "System Administrator",
        passwordHash: hashedPassword,
        role: "admin",
        isActive: true,
      },
    });
    console.log(`✅ Admin user created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`✅ Admin user already exists: ${adminEmail}`);
  }
}

// Main execution - runs all seed functions in order
connectDummyData()
  .then(seedCrops)
  .then(seedSensorTypes)
  .then(seedAdminUser)
  .then(seedSubscriptionPlans)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

  async function seedSubscriptionPlans() {
  const plans = [
    {
      planName: "Basic",
      planCode: "basic",
      priceMonthly: 499,
      priceYearly: 4999,
      maxDevices: 1,
      maxSensorsPerDevice: 5,
      dataRetentionDays: 30,
      featuresJson: { liveData: true, forecast: false, insights: false, advisory: false },
    },
    {
      planName: "Pro",
      planCode: "pro",
      priceMonthly: 999,
      priceYearly: 9999,
      maxDevices: 5,
      maxSensorsPerDevice: 10,
      dataRetentionDays: 90,
      featuresJson: { liveData: true, forecast: true, insights: true, advisory: false },
    },
    {
      planName: "Enterprise",
      planCode: "enterprise",
      priceMonthly: 2499,
      priceYearly: 24999,
      maxDevices: null,
      maxSensorsPerDevice: null,
      dataRetentionDays: 365,
      featuresJson: { liveData: true, forecast: true, insights: true, advisory: true },
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { planCode: plan.planCode },
      update: plan,
      create: plan,
    });
  }
  console.log("Subscription plans seeded.");
}

