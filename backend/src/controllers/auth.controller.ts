import type { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service.js";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { generateToken } from "../utils/jwt.util.js";
import passport from "../config/passport.js";
import { env } from "../config/env.js";

export async function register(req: Request, res: Response) {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password) {
      return sendError(res, "Email and password are required", 400);
    }

    // Reject role parameter - all registered users are customers
    if (role !== undefined) {
      return sendError(
        res,
        "Role cannot be specified during registration. All registered users are customers. Admin accounts are pre-configured.",
        400
      );
    }

    // All registered users are customers (admin accounts are pre-configured)
    const result = await registerUser({
      email,
      password,
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
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return sendError(res, "Google OAuth is not configured", 503);
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res);
}

export function googleCallback(req: Request, res: Response) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return sendError(res, "Google OAuth is not configured", 503);
  }
  passport.authenticate("google", { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      console.error("Google OAuth error:", err);
      // In development, show more details
      const errorMessage =
        env.NODE_ENV === "development"
          ? `Authentication failed: ${err.message || err.toString()}`
          : "Authentication failed";
      // Redirect to frontend with error
      const errorParam = encodeURIComponent(errorMessage);
      return res.redirect(`${env.FRONTEND_URL}/auth/google/callback?error=${errorParam}`);
    }
    if (!user) {
      if (info?.message === "EMAIL_EXISTS") {
        const errorMsg = `Email ${info.email} is already registered`;
        return res.redirect(`${env.FRONTEND_URL}/auth/google/callback?error=${encodeURIComponent(errorMsg)}`);
      }
      console.error("Google OAuth user not found. Info:", info);
      const errorMessage =
        env.NODE_ENV === "development"
          ? `Authentication failed: ${info?.message || "User not found"}`
          : "Authentication failed";
      return res.redirect(`${env.FRONTEND_URL}/auth/google/callback?error=${encodeURIComponent(errorMessage)}`);
    }

    const token = generateToken({
      userId: user.user_id,
      email: user.email,
      role: user.role,
    });

    // Redirect to frontend with token in URL
    return res.redirect(`${env.FRONTEND_URL}/auth/google/callback?token=${encodeURIComponent(token)}`);
  })(req, res);
}

export async function logout(req: Request, res: Response) {
  // For JWT-based auth, logout is primarily a client-side action
  // The client should remove the token from storage
  // This endpoint confirms the logout and can be used for logging/analytics
  return sendSuccess(res, { message: "Logged out successfully" }, "Logout successful", 200);
}

