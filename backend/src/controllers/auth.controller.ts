import type { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service.js";
import { sendSuccess, sendError } from "../utils/response.util.js";

export async function register(req: Request, res: Response) {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return sendError(res, "Email, password, and role are required", 400);
    }

    // Normalize role (convert to lowercase to match enum)
    const normalizedRole = role.toLowerCase();

    // Validate role
    if (normalizedRole !== "customer" && normalizedRole !== "admin") {
      return sendError(res, "Role must be 'customer' or 'admin'", 400);
    }

    const result = await registerUser({
      email,
      password,
      role: normalizedRole as "customer" | "admin",
    });

    return sendSuccess(res, result, "User registered successfully", 201);
  } catch (error: any) {
    return sendError(
      res,
      error.message || "Registration failed",
      error.message?.includes("already exists") ? 409 : 400
    );
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return sendError(res, "Email and password are required", 400);
    }

    const result = await loginUser({
      email,
      password,
    });

    return sendSuccess(res, result, "Login successful", 200);
  } catch (error: any) {
    return sendError(
      res,
      error.message || "Login failed",
      401
    );
  }
}

