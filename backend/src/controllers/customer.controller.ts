/**
 * Customer Controller
 * 
 * Endpoints for managing customer information.
 * - Customers can only access their own customer info
 * - Admins can access any user's customer info
 * 
 * Note: /profile endpoints combine User + CustomerInfo for convenience.
 */

import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { createCustomer, getCustomerByUserId, updateCustomer, deleteCustomer, } from "../services/customer.service.js";
import type { UpdateCustomerInput } from "../services/customer.service.js";

/**
 * Check if user is authorized to access the specified user_id
 * Customers can only access their own data, admins can access any
 */
const checkAuthorization = (req: Request, targetUserId: number): boolean => {
  const user = (req as any).user as { userId: number; role: string } | undefined;
  if (!user) return false;
  
  // Admins can access any user's data
  if (user.role?.toLowerCase() === "admin") {
    return true;
  }
  
  // Customers can only access their own data
  return user.userId === targetUserId;
};

const parseUserId = (v: unknown) => {
  const id = Number(v);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const parseDOB = (v: unknown) => {
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
};

const mapPrismaError = (e: unknown) => {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2025") return { status: 404, msg: "Customer not found" };
    if (e.code === "P2002") return { status: 409, msg: "Customer already exists" };
  }
  return { status: 400, msg: "Database error" };
};

export async function createCustomerHandler(req: Request, res: Response) {
  const { user_id, full_name, phone, passport_number, date_of_birth, emergency_contact_name, emergency_contact_phone } = req.body || {};
  const id = parseUserId(user_id);
  const dob = parseDOB(date_of_birth);
  if (!id || !full_name || !passport_number || !dob)
    return sendError(res, "Invalid input: user_id, full_name, passport_number, date_of_birth are required", 422);

  // Authorization check: customers can only create their own info, admins can create for anyone
  if (!checkAuthorization(req, id)) {
    return sendError(res, "You can only create customer info for your own account", 403);
  }

  try {
    const created = await createCustomer({ user_id: id, full_name, phone, passport_number, date_of_birth: dob, emergency_contact_name, emergency_contact_phone });
    return sendSuccess(res, created, "Customer created", 201);
  } catch (e) {
    const { status, msg } = mapPrismaError(e);
    return sendError(res, msg, status);
  }
}

export async function getCustomerHandler(req: Request, res: Response) {
  const id = parseUserId(req.params.userId ?? req.query.user_id);
  if (!id) return sendError(res, "user_id is required", 422);

  // Authorization check: customers can only view their own info, admins can view anyone's
  if (!checkAuthorization(req, id)) {
    return sendError(res, "You can only view your own customer info", 403);
  }

  try {
    const item = await getCustomerByUserId(id);
    if (!item) return sendError(res, "Customer not found", 404);
    return sendSuccess(res, item);
  } catch (e) {
    const { status, msg } = mapPrismaError(e);
    return sendError(res, msg, status);
  }
}

export async function updateCustomerHandler(req: Request, res: Response) {
  const id = parseUserId(req.params.userId ?? req.body?.user_id);
  if (!id) return sendError(res, "user_id is required", 422);

  // Authorization check: customers can only update their own info, admins can update anyone's
  if (!checkAuthorization(req, id)) {
    return sendError(res, "You can only update your own customer info", 403);
  }

  const {
    full_name,
    phone,
    passport_number,
    date_of_birth,
    emergency_contact_name,
    emergency_contact_phone,
  } = req.body ?? {};

  // Build payload without undefineds (required with exactOptionalPropertyTypes)
  const data: UpdateCustomerInput = {};
  if (full_name !== undefined) data.full_name = full_name;
  if (phone !== undefined) data.phone = phone;
  if (passport_number !== undefined) data.passport_number = passport_number;
  if (emergency_contact_name !== undefined) data.emergency_contact_name = emergency_contact_name;
  if (emergency_contact_phone !== undefined) data.emergency_contact_phone = emergency_contact_phone;

  if (date_of_birth !== undefined) {
    const d = parseDOB(date_of_birth); // returns Date | null
    if (!d) return sendError(res, "Invalid date_of_birth", 422);
    data.date_of_birth = d; // exactly Date
  }

  if (Object.keys(data).length === 0)
    return sendError(res, "No fields to update", 422);

  try {
    const updated = await updateCustomer(id, data);
    return sendSuccess(res, updated);
  } catch (e) {
    const { status, msg } = mapPrismaError(e);
    return sendError(res, msg, status);
  }
}

export async function deleteCustomerHandler(req: Request, res: Response) {
  const id = parseUserId(req.params.userId ?? req.query.user_id ?? req.body?.user_id);
  if (!id) return sendError(res, "user_id is required", 422);

  // Authorization check: customers can only delete their own info, admins can delete anyone's
  if (!checkAuthorization(req, id)) {
    return sendError(res, "You can only delete your own customer info", 403);
  }

  try {
    const deleted = await deleteCustomer(id);
    return sendSuccess(res, deleted);
  } catch (e) {
    const { status, msg } = mapPrismaError(e);
    return sendError(res, msg, status);
  }
}
