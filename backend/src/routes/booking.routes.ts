import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
    createBookingHandler,
    getBookingsHandler,
    getBookingByIdHandler,
    cancelBookingHandler,
} from "../controllers/booking.controller.js";

const router = Router();

// All booking routes require authentication
router.use(authMiddleware);

// POST /bookings - Create a new booking
router.post("/", createBookingHandler);

// GET /bookings - Get all bookings for the logged-in user
router.get("/", getBookingsHandler);

// GET /bookings/:id - Get a single booking by ID
router.get("/:id", getBookingByIdHandler);

// DELETE /bookings/:id - Cancel a booking
router.delete("/:id", cancelBookingHandler);

export default router;

