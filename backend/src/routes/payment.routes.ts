import { Router } from "express";
import { validatePaymentHandler } from "../controllers/payment.controller.js";

const router = Router();

router.post("/validate", validatePaymentHandler);

export default router;
