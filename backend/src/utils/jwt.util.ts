import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

export function generateToken(payload: JWTPayload): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as any);
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

