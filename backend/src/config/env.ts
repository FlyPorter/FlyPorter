import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

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
  SPACES_ENDPOINT: process.env.SPACES_ENDPOINT || "",
  SPACES_REGION: process.env.SPACES_REGION || "us-east-1",
  SPACES_ACCESS_KEY: process.env.SPACES_ACCESS_KEY || "",
  SPACES_SECRET_KEY: process.env.SPACES_SECRET_KEY || "",
  SPACES_BUCKET: process.env.SPACES_BUCKET || "",
  SPACES_CDN_BASE_URL: process.env.SPACES_CDN_BASE_URL || "",
  SPACES_INVOICE_PREFIX: process.env.SPACES_INVOICE_PREFIX || "invoices",
} as const;

