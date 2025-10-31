import type { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T | undefined;
  message?: string | undefined;
  error?: string | undefined;
}

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
) {
  const response: ApiResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message !== undefined && { message }),
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  error: string,
  statusCode: number = 400
) {
  const response: ApiResponse = {
    success: false,
    error,
  };
  res.status(statusCode).json(response);
}

