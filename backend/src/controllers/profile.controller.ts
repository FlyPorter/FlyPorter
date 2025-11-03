import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { getProfile, updateProfile, type UpdateProfileInput } from "../services/profile.service.js";

/**
 * Parse date of birth from request body
 */
const parseDOB = (v: unknown) => {
    const d = new Date(String(v));
    return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Map Prisma errors to HTTP responses
 */
const mapPrismaError = (e: unknown) => {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2025") return { status: 404, msg: "Profile not found" };
        if (e.code === "P2002") return { status: 409, msg: "Email already exists" };
    }
    return { status: 400, msg: "Database error" };
};

/**
 * GET /profile
 * Get the logged-in user's profile
 */
export async function getProfileHandler(req: Request, res: Response) {
    // req.user is set by authMiddleware
    const userId = (req as any).user?.userId;

    if (!userId) {
        return sendError(res, "User not authenticated", 401);
    }

    try {
        const profile = await getProfile(userId);

        if (!profile) {
            return sendError(res, "Profile not found", 404);
        }

        return sendSuccess(res, profile);
    } catch (e) {
        const { status, msg } = mapPrismaError(e);
        return sendError(res, msg, status);
    }
}

/**
 * PATCH /profile
 * Update the logged-in user's profile
 */
export async function updateProfileHandler(req: Request, res: Response) {
    // req.user is set by authMiddleware
    const userId = (req as any).user?.userId;

    if (!userId) {
        return sendError(res, "User not authenticated", 401);
    }

    const {
        email,
        full_name,
        phone,
        passport_number,
        date_of_birth,
        emergency_contact_name,
        emergency_contact_phone,
    } = req.body ?? {};

    // Build payload without undefineds (required with exactOptionalPropertyTypes)
    const data: UpdateProfileInput = {};

    // User fields
    if (email !== undefined) {
        if (typeof email !== "string" || !email.trim()) {
            return sendError(res, "Invalid email", 422);
        }
        data.email = email;
    }

    // CustomerInfo fields
    if (full_name !== undefined) data.full_name = full_name;
    if (phone !== undefined) data.phone = phone;
    if (passport_number !== undefined) data.passport_number = passport_number;
    if (emergency_contact_name !== undefined) data.emergency_contact_name = emergency_contact_name;
    if (emergency_contact_phone !== undefined) data.emergency_contact_phone = emergency_contact_phone;

    if (date_of_birth !== undefined) {
        const d = parseDOB(date_of_birth);
        if (!d) {
            return sendError(res, "Invalid date_of_birth", 422);
        }
        data.date_of_birth = d;
    }

    // Check if there are any fields to update
    if (Object.keys(data).length === 0) {
        return sendError(res, "No fields to update", 422);
    }

    try {
        const updated = await updateProfile(userId, data);
        return sendSuccess(res, updated, "Profile updated successfully");
    } catch (e) {
        const { status, msg } = mapPrismaError(e);
        return sendError(res, msg, status);
    }
}

