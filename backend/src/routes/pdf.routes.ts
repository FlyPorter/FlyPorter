import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getBookingInvoiceUrlHandler,
  downloadBookingInvoiceHandler,
} from "../controllers/pdf.controller.js";

const router = Router();

router.use(authMiddleware);

// Get signed URL for invoice in Digital Ocean Spaces
router.get("/invoice/:bookingId", getBookingInvoiceUrlHandler);

// Direct download (alternative, streams PDF from backend)
router.get("/invoice/:bookingId/download", downloadBookingInvoiceHandler);

export default router;

