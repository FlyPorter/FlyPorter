import dotenv from "dotenv";

// Load environment variables based on NODE_ENV
// Development: .env
// Production: .env.production (if exists, otherwise falls back to .env)
// You can also set environment variables directly in DigitalOcean (recommended for production)
const nodeEnv = process.env.NODE_ENV || "development";
const envFile = nodeEnv === "production" ? ".env.production" : ".env";

// Try to load the environment-specific file, fallback to .env if not found
dotenv.config({ path: envFile });
// Also load .env as fallback (for shared variables)
if (nodeEnv === "production") {
  dotenv.config({ path: ".env", override: false });
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || "3000",
  API_PREFIX: process.env.API_PREFIX || "/api",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  SPACES_ENDPOINT: process.env.SPACES_ENDPOINT || "",
  SPACES_REGION: process.env.SPACES_REGION || "us-east-1",
  SPACES_ACCESS_KEY: process.env.SPACES_ACCESS_KEY || "",
  SPACES_SECRET_KEY: process.env.SPACES_SECRET_KEY || "",
  SPACES_BUCKET: process.env.SPACES_BUCKET || "",
  SPACES_CDN_BASE_URL: process.env.SPACES_CDN_BASE_URL || "",
  SPACES_INVOICE_PREFIX: process.env.SPACES_INVOICE_PREFIX || "invoices",
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || "",
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || "flyporterairlines@protonmail.com",
  SENDGRID_FROM_NAME: process.env.SENDGRID_FROM_NAME || "FlyPorter",
} as const;

