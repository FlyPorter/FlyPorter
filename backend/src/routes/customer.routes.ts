import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
    createCustomerHandler,
    getCustomerHandler,
    updateCustomerHandler,
    deleteCustomerHandler,
} from "../controllers/customer.controller.js";

const router = Router();

// All customer routes require authentication
// Authorization is handled per-endpoint in the controller
router.use(authMiddleware);

// POST /customers - Create customer info for a user
router.post("/", createCustomerHandler);

// GET /customers/:userId - Get customer info by user ID
router.get("/:userId", getCustomerHandler);

// PATCH /customers/:userId - Update customer info by user ID
router.patch("/:userId", updateCustomerHandler);

// DELETE /customers/:userId - Delete customer info by user ID
router.delete("/:userId", deleteCustomerHandler);

export default router;

