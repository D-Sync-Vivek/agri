import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "8000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET || "gridsphere_super_secret_key_change_in_production",
    algorithm: (process.env.JWT_ALGORITHM || "HS256") as string,
    expiresInMinutes: parseInt(process.env.JWT_EXPIRES_IN_MINUTES || "10080", 10), // 7 days, matches original
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
  },
};


