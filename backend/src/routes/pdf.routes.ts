import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getBookingInvoiceHandler,
  uploadBookingInvoiceHandler,
} from "../controllers/pdf.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/invoice/:bookingId", getBookingInvoiceHandler);
router.post("/invoice/:bookingId/upload", uploadBookingInvoiceHandler);

export default router;

