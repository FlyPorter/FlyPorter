import type { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as { role?: string } | undefined;
  if (!user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  if ((user.role || "").toLowerCase() !== "admin") {
    return res.status(403).json({ success: false, error: "Admin role required" });
  }
  next();
}


