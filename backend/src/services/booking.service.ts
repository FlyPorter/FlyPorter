import { prisma } from "../config/prisma.js";
import type { BookingStatus, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { uploadBookingInvoiceToSpaces } from "./pdf.service.js";
import { sendBookingCancellationNotification, sendBookingConfirmationNotification } from "../utils/push-notification.util.js";

type CancellationNotificationContext = {
    userId: number;
    bookingId: number;
    flightDetails: string;
};

function formatFlightDetailsForNotification({
    originCode,
    destinationCode,
    departureTime,
    confirmationCode,
    bookingId,
}: {
    originCode?: string | null;
    destinationCode?: string | null;
    departureTime?: Date | null;
    confirmationCode?: string | null;
    bookingId: number;
}): string {
    const routeSegment =
        originCode && destinationCode
            ? `${originCode} → ${destinationCode}`
            : confirmationCode
                ? `booking ${confirmationCode}`
                : `booking #${bookingId}`;

    if (!departureTime) {
        return routeSegment;
    }

    const date = new Date(departureTime);
    const datePart = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    const timePart = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });

    return `${routeSegment} on ${datePart} at ${timePart}`;
}

/**
 * Generate a unique confirmation code (6 uppercase alphanumeric characters)
 */
function generateConfirmationCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

export interface CreateBookingInput {
    user_id: number;
    flight_id: number;
    seat_number: string;
    status: BookingStatus;
    total_price?: Decimal | number;
}

export interface BookingWithDetails {
    booking_id: number;
    user_id: number;
    flight_id: number;
    seat_number: string;
    booking_time: Date;
    status: BookingStatus;
    total_price: Decimal | null;
    confirmation_code: string | null;
    updated_at: Date;
    user?: {
        email: string;
        customer_info: {
            full_name: string;
        } | null;
    };
    flight: {
        flight_id: number;
        departure_time: Date;
        arrival_time: Date;
        base_price: Decimal;
        route: {
            route_id: number;
            origin_airport: {
                airport_code: string;
                airport_name: string;
                city_name: string;
            };
            destination_airport: {
                airport_code: string;
                airport_name: string;
                city_name: string;
            };
        };
        airline: {
            airline_code: string;
            airline_name: string;
        };
    };
    seat: {
        seat_number: string;
        class: string;
        price_modifier: Decimal;
    };
}

/**
 * Create a new booking
 * This handles:
 * 1. Validating flight details
 * 2. Locking seat availability
 * 3. Calculating total price
 * 4. Creating booking with confirmation code and notification
 * All in a transaction for data consistency
 * 
 * Note: Passenger information can be provided at booking time and is not required in profile.
 */
async function createBookingInTransaction(
    tx: Prisma.TransactionClient,
    input: CreateBookingInput
) {
    const { user_id, flight_id, seat_number } = input;

    // 1. Get flight details for price calculation
    const flight = await tx.flight.findUnique({
        where: { flight_id },
        select: {
            flight_id: true,
            departure_time: true,
            base_price: true,
        },
    });

    if (!flight) {
        throw new Error("Flight not found");
    }

    // 2. Get seat and check availability
    const seat = await tx.seat.findUnique({
        where: {
            flight_id_seat_number: {
                flight_id,
                seat_number,
            },
        },
    });

    if (!seat) {
        throw new Error("Seat not found");
    }

    if (!seat.is_available) {
        throw new Error("Seat is not available");
    }

    // 3. Attempt to lock the seat to prevent concurrent bookings
    const seatLock = await tx.seat.updateMany({
        where: {
            flight_id,
            seat_number,
            is_available: true,
        },
        data: {
            is_available: false,
        },
    });

    if (seatLock.count === 0) {
        throw new Error("Seat is not available");
    }

    // 4. Calculate total price
    const basePrice = new Decimal(flight.base_price);
    const priceModifier = new Decimal(seat.price_modifier);
    const totalPrice = basePrice.mul(priceModifier);

    // 5. Generate unique confirmation code
    let confirmationCode = generateConfirmationCode();
    let attempts = 0;
    while (attempts < 10) {
        const existing = await tx.booking.findUnique({
            where: { confirmation_code: confirmationCode },
        });
        if (!existing) break;
        confirmationCode = generateConfirmationCode();
        attempts++;
    }

    // 6. Create the booking
    const booking = await tx.booking.create({
        data: {
            user_id,
            flight_id,
            seat_number,
            status: input.status || "confirmed",
            total_price: totalPrice,
            confirmation_code: confirmationCode,
        },
        select: {
            booking_id: true,
            user_id: true,
            flight_id: true,
            seat_number: true,
            booking_time: true,
            status: true,
            total_price: true,
            confirmation_code: true,
            updated_at: true,
        },
    });

    // 7. Create notification for booking confirmation
    const flightDate = new Date(flight.departure_time);
    const formattedDate = flightDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    
    await tx.notification.create({
        data: {
            user_id,
            booking_id: booking.booking_id,
            flight_id,
            type: "BOOKING_CONFIRMATION",
            title: "Booking Confirmed",
            message: `Your booking ${confirmationCode} has been confirmed for flight on ${formattedDate}.`,
        },
    });

    return booking;
}

export async function createBooking(input: CreateBookingInput) {
    const { user_id } = input;

    return prisma.$transaction((tx) => createBookingInTransaction(tx, input)).then(async (booking) => {
        // 1. Check if user has customer info (passenger info required)
        // 9. Automatically upload invoice PDF to Digital Ocean Spaces
        // This is done async (fire-and-forget) to not block the booking response
        // If it fails, user can still request it later via GET /api/pdf/invoice/:bookingId
        uploadBookingInvoiceToSpaces({
            bookingId: booking.booking_id,
            userId: user_id,
        }).then(() => {
            console.log(`✓ Invoice uploaded to Spaces for booking ${booking.booking_id}`);
        }).catch((error) => {
            // Only log if it's not a Spaces configuration issue (local development)
            if (!error?.message?.includes("Spaces configuration is incomplete")) {
                console.error(`✗ Failed to upload invoice for booking ${booking.booking_id}:`, error.message);
            }
            // Don't throw - this is best-effort, user can request it later
        });

        setTimeout(() => {
            (async () => {
                try {
                    const flight = await prisma.flight.findUnique({
                        where: { flight_id: booking.flight_id },
                        select: { departure_time: true },
                    });
                    await sendBookingConfirmationNotification(
                        user_id,
                        booking.confirmation_code,
                        booking.booking_id,
                        flight?.departure_time || null
                    );
                } catch (error) {
                    console.error(`Failed to send confirmation notification for booking ${booking.booking_id}:`, error);
                }
            })();
        }, 5000);

        return booking;
    });
}

export interface RoundTripBookingInput {
    user_id: number;
    outbound: {
        flight_id: number;
        seat_number: string;
    };
    inbound: {
        flight_id: number;
        seat_number: string;
    };
}

export async function createRoundTripBooking(input: RoundTripBookingInput) {
    const { user_id, outbound, inbound } = input;

    const result = await prisma.$transaction(async (tx) => {
        const outboundBooking = await createBookingInTransaction(tx, {
            user_id,
            flight_id: outbound.flight_id,
            seat_number: outbound.seat_number,
            status: "confirmed",
        });

        const inboundBooking = await createBookingInTransaction(tx, {
            user_id,
            flight_id: inbound.flight_id,
            seat_number: inbound.seat_number,
            status: "confirmed",
        });

        return { outbound: outboundBooking, inbound: inboundBooking };
    });

    // Fire-and-forget invoice uploads for both legs
    uploadBookingInvoiceToSpaces({
        bookingId: result.outbound.booking_id,
        userId: user_id,
    }).catch((error) => {
        // Only log if it's not a Spaces configuration issue (local development)
        if (!error?.message?.includes("Spaces configuration is incomplete")) {
            console.error(
                `✗ Failed to upload invoice for outbound booking ${result.outbound.booking_id}:`,
                error.message
            );
        }
    });

    uploadBookingInvoiceToSpaces({
        bookingId: result.inbound.booking_id,
        userId: user_id,
    }).catch((error) => {
        // Only log if it's not a Spaces configuration issue (local development)
        if (!error?.message?.includes("Spaces configuration is incomplete")) {
            console.error(
                `✗ Failed to upload invoice for inbound booking ${result.inbound.booking_id}:`,
                error.message
            );
        }
    });

    const schedulePush = (booking: { booking_id: number; confirmation_code: string | null; flight_id: number }) => {
        setTimeout(() => {
            (async () => {
                try {
                    const flight = await prisma.flight.findUnique({
                        where: { flight_id: booking.flight_id },
                        select: { departure_time: true },
                    });
                    await sendBookingConfirmationNotification(
                        user_id,
                        booking.confirmation_code,
                        booking.booking_id,
                        flight?.departure_time || null
                    );
                } catch (error) {
                    console.error(`Failed to send confirmation notification for booking ${booking.booking_id}:`, error);
                }
            })();
        }, 5000);
    };

    schedulePush(result.outbound);
    schedulePush(result.inbound);

    return result;
}

/**
 * Get all bookings for a user
 */
export async function getUserBookings(userId: number): Promise<BookingWithDetails[]> {
    return prisma.booking.findMany({
        where: { user_id: userId },
        orderBy: { booking_time: "desc" },
        select: {
            booking_id: true,
            user_id: true,
            flight_id: true,
            seat_number: true,
            booking_time: true,
            status: true,
            total_price: true,
            confirmation_code: true,
            updated_at: true,
            flight: {
                select: {
                    flight_id: true,
                    departure_time: true,
                    arrival_time: true,
                    base_price: true,
                    route: {
                        select: {
                            route_id: true,
                            origin_airport: {
                                select: {
                                    airport_code: true,
                                    airport_name: true,
                                    city_name: true,
                                },
                            },
                            destination_airport: {
                                select: {
                                    airport_code: true,
                                    airport_name: true,
                                    city_name: true,
                                },
                            },
                        },
                    },
                    airline: {
                        select: {
                            airline_code: true,
                            airline_name: true,
                        },
                    },
                },
            },
            seat: {
                select: {
                    seat_number: true,
                    class: true,
                    price_modifier: true,
                },
            },
        },
    });
}

/**
 * Get a single booking by ID (with authorization check)
 */
export async function getBookingById(
    bookingId: number,
    userId?: number
): Promise<BookingWithDetails | null> {
    const where: any = { booking_id: bookingId };
    if (userId !== undefined) {
        where.user_id = userId; // Only return if user owns this booking
    }

    return prisma.booking.findFirst({
        where,
        select: {
            booking_id: true,
            user_id: true,
            flight_id: true,
            seat_number: true,
            booking_time: true,
            status: true,
            total_price: true,
            confirmation_code: true,
            updated_at: true,
            flight: {
                select: {
                    flight_id: true,
                    departure_time: true,
                    arrival_time: true,
                    base_price: true,
                    route: {
                        select: {
                            route_id: true,
                            origin_airport: {
                                select: {
                                    airport_code: true,
                                    airport_name: true,
                                    city_name: true,
                                },
                            },
                            destination_airport: {
                                select: {
                                    airport_code: true,
                                    airport_name: true,
                                    city_name: true,
                                },
                            },
                        },
                    },
                    airline: {
                        select: {
                            airline_code: true,
                            airline_name: true,
                        },
                    },
                },
            },
            seat: {
                select: {
                    seat_number: true,
                    class: true,
                    price_modifier: true,
                },
            },
        },
    });
}

/**
 * Change seat for an existing booking (customer-initiated)
 *
 * Rules:
 * - Booking must belong to the given user
 * - Booking status must be confirmed
 * - New seat must be on the same flight and currently available
 * - Seat locking is done via updateMany (optimistic lock) to avoid race conditions
 * - Old seat is released back to available
 * - Total price is recalculated: base_price * newSeat.price_modifier
 */
export async function changeBookingSeat(params: {
    bookingId: number;
    userId: number;
    newSeatNumber: string;
}): Promise<BookingWithDetails> {
    const { bookingId, userId, newSeatNumber } = params;

    const updatedBooking = await prisma.$transaction(async (tx) => {
        // 1. Load booking with ownership & status check + flight base price
        const booking = await tx.booking.findFirst({
            where: {
                booking_id: bookingId,
                user_id: userId,
                status: "confirmed",
            },
            select: {
                booking_id: true,
                user_id: true,
                flight_id: true,
                seat_number: true,
                flight: {
                    select: {
                        base_price: true,
                    },
                },
            },
        });

        if (!booking) {
            throw new Error("Booking not found or not eligible for seat change");
        }

        const trimmedSeatNumber = newSeatNumber.trim();
        if (!trimmedSeatNumber) {
            throw new Error("New seat_number is required");
        }

        // 2. Ensure new seat exists on same flight
        const newSeat = await tx.seat.findUnique({
            where: {
                flight_id_seat_number: {
                    flight_id: booking.flight_id,
                    seat_number: trimmedSeatNumber,
                },
            },
        });

        if (!newSeat) {
            throw new Error("Seat not found");
        }

        if (!newSeat.is_available) {
            throw new Error("Seat is not available");
        }

        // 3. Lock new seat optimistically
        const seatLock = await tx.seat.updateMany({
            where: {
                flight_id: booking.flight_id,
                seat_number: trimmedSeatNumber,
                is_available: true,
            },
            data: {
                is_available: false,
            },
        });

        if (seatLock.count === 0) {
            throw new Error("Seat is not available");
        }

        // 4. Release old seat
        await tx.seat.update({
            where: {
                flight_id_seat_number: {
                    flight_id: booking.flight_id,
                    seat_number: booking.seat_number,
                },
            },
            data: {
                is_available: true,
            },
        });

        // 5. Recalculate total price
        const basePrice = new Decimal(booking.flight.base_price);
        const priceModifier = new Decimal(newSeat.price_modifier);
        const totalPrice = basePrice.mul(priceModifier);

        // 6. Update booking record
        await tx.booking.update({
            where: { booking_id: booking.booking_id },
            data: {
                seat_number: trimmedSeatNumber,
                total_price: totalPrice,
                updated_at: new Date(),
            },
        });

        // 7. Return booking with details (fresh read)
        const updated = await tx.booking.findFirst({
            where: { booking_id: booking.booking_id },
            select: {
                booking_id: true,
                user_id: true,
                flight_id: true,
                seat_number: true,
                booking_time: true,
                status: true,
                total_price: true,
                confirmation_code: true,
                updated_at: true,
                user: {
                    select: {
                        email: true,
                        customer_info: {
                            select: {
                                full_name: true,
                            },
                        },
                    },
                },
                flight: {
                    select: {
                        flight_id: true,
                        departure_time: true,
                        arrival_time: true,
                        base_price: true,
                        route: {
                            select: {
                                route_id: true,
                                origin_airport: {
                                    select: {
                                        airport_code: true,
                                        airport_name: true,
                                        city_name: true,
                                    },
                                },
                                destination_airport: {
                                    select: {
                                        airport_code: true,
                                        airport_name: true,
                                        city_name: true,
                                    },
                                },
                            },
                        },
                        airline: {
                            select: {
                                airline_code: true,
                                airline_name: true,
                            },
                        },
                    },
                },
                seat: {
                    select: {
                        seat_number: true,
                        class: true,
                        price_modifier: true,
                    },
                },
            },
        });

        if (!updated) {
            throw new Error("Failed to load updated booking");
        }

        return updated;
    });

    return updatedBooking;
}

/**
 * Cancel a booking
 * This handles:
 * 1. Update booking status to cancelled
 * 2. Make seat available again
 * 3. Create notification
 */
export async function cancelBooking(bookingId: number, userId: number) {
    const { updatedBooking, notificationContext } = await prisma.$transaction(async (tx) => {
        // 1. Get the booking
        const booking = await tx.booking.findFirst({
            where: {
                booking_id: bookingId,
                user_id: userId, // Ensure user owns this booking
            },
            select: {
                booking_id: true,
                status: true,
                flight_id: true,
                seat_number: true,
                confirmation_code: true,
                flight: {
                    select: {
                        departure_time: true,
                        route: {
                            select: {
                                origin_airport: {
                                    select: {
                                        airport_code: true,
                                    },
                                },
                                destination_airport: {
                                    select: {
                                        airport_code: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!booking) {
            throw new Error("Booking not found or you don't have permission to cancel it");
        }

        if (booking.status === "cancelled") {
            throw new Error("Booking is already cancelled");
        }

        // Check if flight is in the past
        if (new Date(booking.flight.departure_time) < new Date()) {
            throw new Error("Cannot cancel a booking for a flight that has already departed");
        }

        // 2. Update booking status
        const updatedBooking = await tx.booking.update({
            where: { booking_id: bookingId },
            data: {
                status: "cancelled",
                updated_at: new Date(),
            },
            select: {
                booking_id: true,
                user_id: true,
                flight_id: true,
                seat_number: true,
                booking_time: true,
                status: true,
                total_price: true,
                confirmation_code: true,
                updated_at: true,
            },
        });

        // 3. Make seat available again
        await tx.seat.update({
            where: {
                flight_id_seat_number: {
                    flight_id: booking.flight_id,
                    seat_number: booking.seat_number,
                },
            },
            data: {
                is_available: true,
            },
        });

        // 4. Create notification for booking cancellation
        await tx.notification.create({
            data: {
                user_id: userId,
                booking_id: bookingId,
                flight_id: booking.flight_id,
                type: "BOOKING_CANCELLATION",
                title: "Booking Cancelled",
                message: `Your booking ${booking.confirmation_code} has been cancelled.`,
            },
        });

        const flightDetails = formatFlightDetailsForNotification({
            originCode: booking.flight.route?.origin_airport?.airport_code,
            destinationCode: booking.flight.route?.destination_airport?.airport_code,
            departureTime: booking.flight.departure_time,
            confirmationCode: booking.confirmation_code,
            bookingId: booking.booking_id,
        });

        return {
            updatedBooking,
            notificationContext: {
                userId,
                bookingId,
                flightDetails,
            } satisfies CancellationNotificationContext,
        };
    });

    if (notificationContext) {
        sendBookingCancellationNotification(
            notificationContext.userId,
            notificationContext.bookingId,
            notificationContext.flightDetails
        ).catch((error) => {
            console.error(
                `Error sending cancellation push notification for booking ${notificationContext.bookingId}:`,
                error
            );
        });
    }

    return updatedBooking;
}

/**
 * Get upcoming bookings for a user
 */
export async function getUpcomingBookings(userId: number): Promise<BookingWithDetails[]> {
    const now = new Date();
    return prisma.booking.findMany({
        where: {
            user_id: userId,
            status: "confirmed",
            flight: {
                departure_time: {
                    gte: now,
                },
            },
        },
        orderBy: {
            flight: {
                departure_time: "asc",
            },
        },
        select: {
            booking_id: true,
            user_id: true,
            flight_id: true,
            seat_number: true,
            booking_time: true,
            status: true,
            total_price: true,
            confirmation_code: true,
            updated_at: true,
            flight: {
                select: {
                    flight_id: true,
                    departure_time: true,
                    arrival_time: true,
                    base_price: true,
                    route: {
                        select: {
                            route_id: true,
                            origin_airport: {
                                select: {
                                    airport_code: true,
                                    airport_name: true,
                                    city_name: true,
                                },
                            },
                            destination_airport: {
                                select: {
                                    airport_code: true,
                                    airport_name: true,
                                    city_name: true,
                                },
                            },
                        },
                    },
                    airline: {
                        select: {
                            airline_code: true,
                            airline_name: true,
                        },
                    },
                },
            },
            seat: {
                select: {
                    seat_number: true,
                    class: true,
                    price_modifier: true,
                },
            },
        },
    });
}

/**
 * Get past bookings for a user
 */
export async function getPastBookings(userId: number): Promise<BookingWithDetails[]> {
    const now = new Date();
    return prisma.booking.findMany({
        where: {
            user_id: userId,
            OR: [
                {
                    flight: {
                        departure_time: {
                            lt: now,
                        },
                    },
                },
                {
                    status: "cancelled",
                },
            ],
        },
        orderBy: {
            flight: {
                departure_time: "desc",
            },
        },
        select: {
            booking_id: true,
            user_id: true,
            flight_id: true,
            seat_number: true,
            booking_time: true,
            status: true,
            total_price: true,
            confirmation_code: true,
            updated_at: true,
            flight: {
                select: {
                    flight_id: true,
                    departure_time: true,
                    arrival_time: true,
                    base_price: true,
                    route: {
                        select: {
                            route_id: true,
                            origin_airport: {
                                select: {
                                    airport_code: true,
                                    airport_name: true,
                                    city_name: true,
                                },
                            },
                            destination_airport: {
                                select: {
                                    airport_code: true,
                                    airport_name: true,
                                    city_name: true,
                                },
                            },
                        },
                    },
                    airline: {
                        select: {
                            airline_code: true,
                            airline_name: true,
                        },
                    },
                },
            },
            seat: {
                select: {
                    seat_number: true,
                    class: true,
                    price_modifier: true,
                },
            },
        },
    });
}

/**
 * Get all bookings (admin only)
 */
export async function getAllBookings(): Promise<BookingWithDetails[]> {
    return prisma.booking.findMany({
        orderBy: { booking_time: "desc" },
        select: {
            booking_id: true,
            user_id: true,
            flight_id: true,
            seat_number: true,
            booking_time: true,
            status: true,
            total_price: true,
            confirmation_code: true,
            updated_at: true,
            user: {
                select: {
                    email: true,
                    customer_info: {
                        select: {
                            full_name: true,
                        },
                    },
                },
            },
            flight: {
                select: {
                    flight_id: true,
                    departure_time: true,
                    arrival_time: true,
                    base_price: true,
                    route: {
                        select: {
                            route_id: true,
                            origin_airport: {
                                select: {
                                    airport_code: true,
                                    airport_name: true,
                                    city_name: true,
                                },
                            },
                            destination_airport: {
                                select: {
                                    airport_code: true,
                                    airport_name: true,
                                    city_name: true,
                                },
                            },
                        },
                    },
                    airline: {
                        select: {
                            airline_code: true,
                            airline_name: true,
                        },
                    },
                },
            },
            seat: {
                select: {
                    seat_number: true,
                    class: true,
                    price_modifier: true,
                },
            },
        },
    });
}

/**
 * Cancel any booking (admin only)
 * This allows admins to cancel any booking without user_id restriction
 */
export async function cancelAnyBooking(bookingId: number) {
    const { updatedBooking, notificationContext } = await prisma.$transaction(async (tx) => {
        // 1. Get the booking (no user_id check for admin)
        const booking = await tx.booking.findUnique({
            where: {
                booking_id: bookingId,
            },
            select: {
                booking_id: true,
                user_id: true,
                status: true,
                flight_id: true,
                seat_number: true,
                confirmation_code: true,
                flight: {
                    select: {
                        departure_time: true,
                        route: {
                            select: {
                                origin_airport: {
                                    select: {
                                        airport_code: true,
                                    },
                                },
                                destination_airport: {
                                    select: {
                                        airport_code: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!booking) {
            throw new Error("Booking not found");
        }

        if (booking.status === "cancelled") {
            throw new Error("Booking is already cancelled");
        }

        // Check if flight is in the past
        if (new Date(booking.flight.departure_time) < new Date()) {
            throw new Error("Cannot cancel a booking for a flight that has already departed");
        }

        // 2. Update booking status
        const updatedBooking = await tx.booking.update({
            where: { booking_id: bookingId },
            data: {
                status: "cancelled",
                updated_at: new Date(),
            },
            select: {
                booking_id: true,
                user_id: true,
                flight_id: true,
                seat_number: true,
                booking_time: true,
                status: true,
                total_price: true,
                confirmation_code: true,
                updated_at: true,
            },
        });

        // 3. Make seat available again
        await tx.seat.update({
            where: {
                flight_id_seat_number: {
                    flight_id: booking.flight_id,
                    seat_number: booking.seat_number,
                },
            },
            data: {
                is_available: true,
            },
        });

        // 4. Create notification for booking cancellation
        await tx.notification.create({
            data: {
                user_id: booking.user_id,
                booking_id: bookingId,
                flight_id: booking.flight_id,
                type: "BOOKING_CANCELLATION",
                title: "Booking Cancelled",
                message: `Your booking ${booking.confirmation_code} has been cancelled by an administrator.`,
            },
        });

        const flightDetails = formatFlightDetailsForNotification({
            originCode: booking.flight.route?.origin_airport?.airport_code,
            destinationCode: booking.flight.route?.destination_airport?.airport_code,
            departureTime: booking.flight.departure_time,
            confirmationCode: booking.confirmation_code,
            bookingId: booking.booking_id,
        });

        return {
            updatedBooking,
            notificationContext: {
                userId: booking.user_id,
                bookingId,
                flightDetails,
            } satisfies CancellationNotificationContext,
        };
    });

    if (notificationContext) {
        sendBookingCancellationNotification(
            notificationContext.userId,
            notificationContext.bookingId,
            notificationContext.flightDetails
        ).catch((error) => {
            console.error(
                `Error sending admin cancellation push notification for booking ${notificationContext.bookingId}:`,
                error
            );
        });
    }

    return updatedBooking;
}
