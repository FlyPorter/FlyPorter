import type { Request, Response } from "express";
import { sendSuccess } from "../utils/response.util.js";
import { validatePayment } from "../services/payment.service.js";

export async function validatePaymentHandler(req: Request, res: Response) {
  const body = (req.body || {}) as Record<string, string | undefined>;
  const cardNumber = body.cardNumber ?? "";
  const expiry = body.expiry ?? "";
  const ccv = body.ccv ?? "";
  const bookingDate = body.bookingDate ?? "";
  const ok = validatePayment(cardNumber, expiry, ccv, bookingDate);
  return sendSuccess(res, { valid: ok });
}
