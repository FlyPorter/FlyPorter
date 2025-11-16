import type { Request, Response } from "express";
import {
  generateBookingInvoicePdf,
  getInvoiceSignedUrl,
} from "../services/pdf.service.js";
import { sendError, sendSuccess } from "../utils/response.util.js";

const parseBookingId = (value: unknown) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

/**
 * GET /api/pdf/invoice/:bookingId
 * Returns a signed URL for the invoice PDF stored in Digital Ocean Spaces
 * The URL is regenerated each time (valid for 1 hour)
 */
export async function getBookingInvoiceUrlHandler(req: Request, res: Response) {
  const userId = (req as any).user?.userId as number | undefined;
  if (!userId) {
    return sendError(res, "User not authenticated", 401);
  }

  const bookingId = parseBookingId(req.params.bookingId);
  if (!bookingId) {
    return sendError(res, "Valid booking ID is required", 422);
  }

  try {
    const result = await getInvoiceSignedUrl({
      bookingId,
      userId,
    });

    return sendSuccess(
      res,
      {
        url: result.url,
        expiresIn: 3600,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        filename: result.filename,
      },
      "Invoice URL generated successfully",
      200
    );
  } catch (error: any) {
    // Only log if it's not a Spaces configuration issue (local development)
    if (!error?.message?.includes("configuration is incomplete") && 
        !error?.message?.includes("Spaces configuration")) {
      console.error("Invoice URL generation error:", error);
    }

    if (error?.message?.includes("configuration is incomplete") || 
        error?.message?.includes("Spaces configuration")) {
      return sendError(
        res,
        "DigitalOcean Spaces is not configured. Please use /api/pdf/invoice/:bookingId/download for direct download.",
        503
      );
    }

    if (error?.message?.includes("not found")) {
      return sendError(res, "Booking not found", 404);
    }

    const errorMessage =
      process.env.NODE_ENV === "development"
        ? `Failed to generate invoice URL: ${error?.message || "Unknown error"}`
        : "Failed to generate invoice URL";

    return sendError(res, errorMessage, 500);
  }
}

/**
 * GET /api/pdf/invoice/:bookingId/download
 * Streams the PDF directly from the backend (no Spaces involved)
 * Alternative endpoint if Spaces is not configured
 */
export async function downloadBookingInvoiceHandler(req: Request, res: Response) {
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
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(buffer);
  } catch (error: any) {
    console.error("Invoice download error:", error);

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

