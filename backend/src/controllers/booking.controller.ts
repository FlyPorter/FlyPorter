import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { sendSuccess, sendError } from "../utils/response.util.js";
import {
    createBooking,
    getUserBookings,
    getBookingById,
    cancelBooking,
    getUpcomingBookings,
    getPastBookings,
    getAllBookings,
    cancelAnyBooking,
    type CreateBookingInput,
} from "../services/booking.service.js";

/**
 * Parse integer ID from request parameter or body
 */
const parseId = (v: unknown) => {
    const id = Number(v);
    return Number.isInteger(id) && id > 0 ? id : null;
};

/**
 * Map Prisma errors to HTTP responses
 */
const mapPrismaError = (e: unknown) => {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2025") return { status: 404, msg: "Resource not found" };
        if (e.code === "P2002") return { status: 409, msg: "Duplicate booking" };
        if (e.code === "P2003") return { status: 400, msg: "Invalid reference" };
    }
    return { status: 400, msg: "Database error" };
};

/**
 * POST /bookings
 * Create a new booking
 * 
 * Body:
 * - flight_id: number (required)
 * - seat_number: string (required)
 * 
 * Note: user_id comes from JWT token, passenger info from CustomerInfo table
 */
export async function createBookingHandler(req: Request, res: Response) {
    // Get user ID from JWT token (set by authMiddleware)
    const userId = (req as any).user?.userId;

    if (!userId) {
        return sendError(res, "User not authenticated", 401);
    }

    const { flight_id, seat_number } = req.body || {};

    // Validate input
    const flightId = parseId(flight_id);
    if (!flightId) {
        return sendError(res, "Valid flight_id is required", 422);
    }

    if (!seat_number || typeof seat_number !== "string") {
        return sendError(res, "Valid seat_number is required", 422);
    }

    try {
        const bookingInput: CreateBookingInput = {
            user_id: userId,
            flight_id: flightId,
            seat_number: seat_number.trim(),
            status: "confirmed",
        };

        const booking = await createBooking(bookingInput);

        return sendSuccess(
            res,
            booking,
            "Booking created successfully",
            201
        );
    } catch (e: any) {
        // Handle specific error messages from service
        if (e.message?.includes("Customer information required")) {
            return sendError(res, e.message, 400);
        }
        if (e.message?.includes("Flight not found")) {
            return sendError(res, e.message, 404);
        }
        if (e.message?.includes("Seat not found")) {
            return sendError(res, e.message, 404);
        }
        if (e.message?.includes("not available")) {
            return sendError(res, e.message, 409);
        }
        if (e.message?.includes("already departed")) {
            return sendError(res, e.message, 400);
        }

        const { status, msg } = mapPrismaError(e);
        return sendError(res, msg, status);
    }
}

/**
 * GET /bookings
 * Get all bookings for the logged-in user
 * 
 * Query params:
 * - filter: "all" | "upcoming" | "past" (default: "all")
 */
export async function getBookingsHandler(req: Request, res: Response) {
    const userId = (req as any).user?.userId;

    if (!userId) {
        return sendError(res, "User not authenticated", 401);
    }

    const filter = req.query.filter as string || "all";

    try {
        let bookings;

        switch (filter) {
            case "upcoming":
                bookings = await getUpcomingBookings(userId);
                break;
            case "past":
                bookings = await getPastBookings(userId);
                break;
            case "all":
            default:
                bookings = await getUserBookings(userId);
                break;
        }

        return sendSuccess(res, bookings);
    } catch (e) {
        const { status, msg } = mapPrismaError(e);
        return sendError(res, msg, status);
    }
}

/**
 * GET /bookings/:id
 * Get a single booking by ID
 */
export async function getBookingByIdHandler(req: Request, res: Response) {
    const userId = (req as any).user?.userId;

    if (!userId) {
        return sendError(res, "User not authenticated", 401);
    }

    const bookingId = parseId(req.params.id);
    if (!bookingId) {
        return sendError(res, "Valid booking ID is required", 422);
    }

    try {
        const booking = await getBookingById(bookingId, userId);

        if (!booking) {
            return sendError(res, "Booking not found", 404);
        }

        return sendSuccess(res, booking);
    } catch (e) {
        const { status, msg } = mapPrismaError(e);
        return sendError(res, msg, status);
    }
}

/**
 * DELETE /bookings/:id
 * Cancel a booking
 */
export async function cancelBookingHandler(req: Request, res: Response) {
    const userId = (req as any).user?.userId;

    if (!userId) {
        return sendError(res, "User not authenticated", 401);
    }

    const bookingId = parseId(req.params.id);
    if (!bookingId) {
        return sendError(res, "Valid booking ID is required", 422);
    }

    try {
        const cancelledBooking = await cancelBooking(bookingId, userId);

        return sendSuccess(
            res,
            cancelledBooking,
            "Booking cancelled successfully"
        );
    } catch (e: any) {
        // Handle specific error messages from service
        if (e.message?.includes("not found") || e.message?.includes("permission")) {
            return sendError(res, e.message, 404);
        }
        if (e.message?.includes("already cancelled")) {
            return sendError(res, e.message, 400);
        }
        if (e.message?.includes("already departed")) {
            return sendError(res, e.message, 400);
        }

        const { status, msg } = mapPrismaError(e);
        return sendError(res, msg, status);
    }
}

/**
 * GET /bookings/admin/all
 * Get all bookings (admin only)
 */
export async function getAllBookingsHandler(req: Request, res: Response) {
    try {
        const bookings = await getAllBookings();
        return sendSuccess(res, bookings);
    } catch (e) {
        const { status, msg } = mapPrismaError(e);
        return sendError(res, msg, status);
    }
}

/**
 * DELETE /bookings/admin/:id
 * Cancel any booking (admin only)
 */
export async function cancelAnyBookingHandler(req: Request, res: Response) {
    const bookingId = parseId(req.params.id);
    if (!bookingId) {
        return sendError(res, "Valid booking ID is required", 422);
    }

    try {
        const cancelledBooking = await cancelAnyBooking(bookingId);

        return sendSuccess(
            res,
            cancelledBooking,
            "Booking cancelled successfully"
        );
    } catch (e: any) {
        // Handle specific error messages from service
        if (e.message?.includes("not found")) {
            return sendError(res, e.message, 404);
        }
        if (e.message?.includes("already cancelled")) {
            return sendError(res, e.message, 400);
        }
        if (e.message?.includes("already departed")) {
            return sendError(res, e.message, 400);
        }

        const { status, msg } = mapPrismaError(e);
        return sendError(res, msg, status);
    }
}
