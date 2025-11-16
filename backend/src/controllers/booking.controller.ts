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
    createRoundTripBooking,
    changeBookingSeat,
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
    const err = e as any;
    const code = err?.code as string | undefined;
    if (code === "P2025") return { status: 404, msg: "Resource not found" };
    if (code === "P2002") return { status: 409, msg: "Duplicate booking" };
    if (code === "P2003") return { status: 400, msg: "Invalid reference" };
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
 * Note: user_id comes from JWT token. Passenger info can be provided at booking time.
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

/**
 * POST /bookings/round-trip
 * Create a round-trip booking (outbound + inbound) in a single transaction.
 *
 * Body:
 * {
 *   "outbound": { "flight_id": number, "seat_number": string },
 *   "inbound":  { "flight_id": number, "seat_number": string }
 * }
 */
export async function createRoundTripBookingHandler(req: Request, res: Response) {
    const userId = (req as any).user?.userId;

    if (!userId) {
        return sendError(res, "User not authenticated", 401);
    }

    const { outbound, inbound } = req.body || {};

    const outboundFlightId = parseId(outbound?.flight_id);
    const inboundFlightId = parseId(inbound?.flight_id);
    const outboundSeat = outbound?.seat_number;
    const inboundSeat = inbound?.seat_number;

    if (!outboundFlightId || !inboundFlightId) {
        return sendError(res, "Valid outbound.flight_id and inbound.flight_id are required", 422);
    }

    if (!outboundSeat || typeof outboundSeat !== "string" || !inboundSeat || typeof inboundSeat !== "string") {
        return sendError(res, "Valid outbound.seat_number and inbound.seat_number are required", 422);
    }

    try {
        const result = await createRoundTripBooking({
            user_id: userId,
            outbound: {
                flight_id: outboundFlightId,
                seat_number: outboundSeat.trim(),
            },
            inbound: {
                flight_id: inboundFlightId,
                seat_number: inboundSeat.trim(),
            },
        });

        return sendSuccess(res, result, "Round-trip booking created successfully", 201);
    } catch (e: any) {
        const msg: string = e?.message || "Failed to create round-trip booking";
        if (msg.includes("Flight not found")) {
            return sendError(res, msg, 404);
        }
        if (msg.includes("Seat not found")) {
            return sendError(res, msg, 404);
        }
        if (msg.includes("not available")) {
            return sendError(res, msg, 409);
        }
        if (msg.includes("already departed")) {
            return sendError(res, msg, 400);
        }

        const { status, msg: mappedMsg } = mapPrismaError(e);
        return sendError(res, mappedMsg, status);
    }
}

/**
 * PATCH /bookings/:id/seat
 * Change seat for an existing booking (customer)
 *
 * Body:
 * - seat_number: string (required) – new seat number on the same flight
 */
export async function changeBookingSeatHandler(req: Request, res: Response) {
    const userId = (req as any).user?.userId;

    if (!userId) {
        return sendError(res, "User not authenticated", 401);
    }

    const bookingId = parseId(req.params.id);
    if (!bookingId) {
        return sendError(res, "Valid booking ID is required", 422);
    }

    const { seat_number } = req.body || {};
    if (!seat_number || typeof seat_number !== "string") {
        return sendError(res, "Valid seat_number is required", 422);
    }

    try {
        const updated = await changeBookingSeat({
            bookingId,
            userId,
            newSeatNumber: seat_number.trim(),
        });

        return sendSuccess(res, updated, "Seat changed successfully");
    } catch (e: any) {
        const msg: string = e?.message || "Failed to change seat";
        if (msg.includes("not found")) {
            return sendError(res, msg, 404);
        }
        if (msg.includes("not available")) {
            return sendError(res, msg, 409);
        }
        return sendError(res, msg, 400);
    }
}
