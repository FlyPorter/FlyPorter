import type { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service.js";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { generateToken } from "../utils/jwt.util.js";
import passport from "../config/passport.js";

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

export function googleAuth(req: Request, res: Response) {
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res);
}

export function googleCallback(req: Request, res: Response) {
  passport.authenticate("google", { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      return sendError(res, "Authentication failed", 500);
    }
    if (!user) {
      if (info?.message === "EMAIL_EXISTS") {
        return sendError(res, `Email ${info.email} is already registered`, 409);
      }
      return sendError(res, "Authentication failed", 401);
    }

    const token = generateToken({
      userId: user.user_id,
      email: user.email,
      role: user.role,
    });

    return sendSuccess(
      res,
      {
        user: {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
        },
        token,
      },
      "Google login successful",
      200
    );
  })(req, res);
}

