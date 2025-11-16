import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";
import {
    createBookingHandler,
    createRoundTripBookingHandler,
    getBookingsHandler,
    getBookingByIdHandler,
    cancelBookingHandler,
    getAllBookingsHandler,
    cancelAnyBookingHandler,
    changeBookingSeatHandler,
} from "../controllers/booking.controller.js";

const router = Router();

// All booking routes require authentication
router.use(authMiddleware);

// POST /bookings/round-trip - Create a round-trip booking (outbound + inbound)
router.post("/round-trip", createRoundTripBookingHandler);

// POST /bookings - Create a new booking
router.post("/", createBookingHandler);

// GET /bookings - Get all bookings for the logged-in user
router.get("/", getBookingsHandler);

// GET /bookings/admin/all - Get all bookings (admin only)
router.get("/admin/all", requireAdmin, getAllBookingsHandler);

// GET /bookings/:id - Get a single booking by ID
router.get("/:id", getBookingByIdHandler);

// PATCH /bookings/:id/seat - Change seat for an existing booking
router.patch("/:id/seat", changeBookingSeatHandler);

// DELETE /bookings/admin/:id - Cancel any booking (admin only)
// Must come before /:id to ensure proper route matching
router.delete("/admin/:id", requireAdmin, cancelAnyBookingHandler);

// DELETE /bookings/:id - Cancel a booking
router.delete("/:id", cancelBookingHandler);

export default router;

