import express, { Application } from "express";
import cors from "cors";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import prisma from "./config/prisma"; // wherever your PrismaClient instance lives
import authRoutes from "./routes/authRoutes";
import deviceRoutes from "./routes/deviceRoutes";
import userRoutes from "./routes/userRoutes";
import readingRoutes from "./routes/readingRoutes";
import sensorRoutes from "./routes/sensorRoutes";
import subscriptionRoutes from "./routes/subscriptionRoutes";
import cropRoutes from "./routes/cropRoutes";
import firmwareRoutes from "./routes/firmwareRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import adminRoutes from "./routes/adminRoutes";


/**
 * Builds the Swagger `parameters` entries for /readings/add dynamically
 * from the sensor_types table, so every sensor type automatically shows
 * up as a query param in Swagger UI without ever touching openapi.yaml.
 */
async function buildSensorParams() {
  const sensorTypes = await prisma.sensorType.findMany({
    orderBy: { name: "asc" },
  });

  return sensorTypes.map((s) => ({
    name: s.code, // e.g. "leaf_wetness" - matches the query key the endpoint looks up
    in: "query",
    description: `${s.name}${s.unit ? ` (${s.unit})` : ""} - only stored if a "${s.code}" device_sensor is installed on this device`,
    schema: { type: "number" },
  }));
}

export async function createApp(): Promise<Application> {
  const app = express();

  app.use(
    cors({
      origin: "*",
      credentials: true,
      methods: "*",
      allowedHeaders: "*",
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (_req, res) => {
    res.status(200).json({ status: "ok", message: "GridSphere API v2 is running" });
  });

  // Swagger UI - interactive docs + "Try it out" for every route.
  const openapiDocument = YAML.load(path.join(__dirname, "config", "openapi.yaml"));

  
  try {
    const sensorParams = await buildSensorParams();
    const readingsAddOp = openapiDocument?.paths?.["/readings/add"]?.get;
    if (readingsAddOp) {
      const existingNames = new Set((readingsAddOp.parameters ?? []).map((p: any) => p.name));
      const newParams = sensorParams.filter((p) => !existingNames.has(p.name));
      readingsAddOp.parameters = [...(readingsAddOp.parameters ?? []), ...newParams];
    }
  } catch (err) {
    // Don't let a DB hiccup at boot time take down Swagger entirely -
    // fall back to whatever's statically defined in openapi.yaml.
    // eslint-disable-next-line no-console
    console.error("Failed to build dynamic sensor params for Swagger:", err);
  }

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument, {
    customSiteTitle: "GridSphere API Docs",
  }));
  app.get("/docs.json", (_req, res) => {
    res.status(200).json(openapiDocument);
  });

  app.use("/", authRoutes);
  app.use("/devices", deviceRoutes);
  app.use("/admin", adminRoutes);
  app.use("/users", userRoutes);
  app.use("/readings", readingRoutes);
  app.use("/sensors", sensorRoutes);
  app.use("/subscriptions", subscriptionRoutes);
  app.use("/crops", cropRoutes);
  app.use("/firmware", firmwareRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}


