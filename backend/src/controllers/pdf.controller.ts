import type { Request, Response } from "express";
import {
  generateBookingInvoicePdf,
  uploadBookingInvoiceToSpaces,
  generateSignedUrl,
} from "../services/pdf.service.js";
import { sendError, sendSuccess } from "../utils/response.util.js";
import { prisma } from "../config/prisma.js";

const parseBookingId = (value: unknown) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function getBookingInvoiceHandler(req: Request, res: Response) {
  const userId = (req as any).user?.userId as number | undefined;
  if (!userId) {
    return sendError(res, "User not authenticated", 401);
  }

  const bookingId = parseBookingId(req.params.bookingId);
  if (!bookingId) {
    return sendError(res, "Valid booking ID is required", 422);
  }

  try {
    const { buffer, filename, mimeType } = await generateBookingInvoicePdf({
      bookingId,
      userId,
    });

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    return res.status(200).send(buffer);
  } catch (error: any) {
    // Log the actual error for debugging
    console.error("Invoice generation error:", error);

    const message =
      error?.message?.includes("not found") || error?.message?.includes("denied")
        ? "Booking not found"
        : process.env.NODE_ENV === "development" 
          ? `Failed to generate invoice: ${error?.message || "Unknown error"}`
          : "Failed to generate invoice";
    const status = message === "Booking not found" ? 404 : 500;
    return sendError(res, message, status);
  }
}

export async function uploadBookingInvoiceHandler(req: Request, res: Response) {
  const userId = (req as any).user?.userId as number | undefined;
  if (!userId) {
    return sendError(res, "User not authenticated", 401);
  }

  const bookingId = parseBookingId(req.params.bookingId);
  if (!bookingId) {
    return sendError(res, "Valid booking ID is required", 422);
  }

  try {
    const uploadResult = await uploadBookingInvoiceToSpaces({
      bookingId,
      userId,
    });

    return sendSuccess(
      res, 
      {
        ...uploadResult,
        expiresIn: 3600,
        note: "URL is valid for 1 hour"
      }, 
      "Invoice uploaded successfully", 
      201
    );
  } catch (error: any) {
    // Log the actual error for debugging
    console.error("Invoice upload error:", error);

    if (error?.message?.includes("configuration is incomplete")) {
      return sendError(res, "DigitalOcean Spaces is not configured", 500);
    }

    if (error?.message?.includes("not found")) {
      return sendError(res, "Booking not found", 404);
    }

    // Return more detailed error message in development
    const errorMessage = process.env.NODE_ENV === "development" 
      ? `Failed to upload invoice: ${error?.message || "Unknown error"}`
      : "Failed to upload invoice";
    
    return sendError(res, errorMessage, 500);
  }
}

