/** Responsibility: restrict a protected route to an explicit set of authenticated roles. */
import type { NextFunction, Request, Response } from "express";
export function authorizeRole(...allowed: string[]) {
  return (req: Request & { user?: { role: string } }, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Authentication required" } }); return; }
    if (!allowed.includes(req.user.role)) { res.status(403).json({ error: { code: "FORBIDDEN", message: "Insufficient role" } }); return; }
    next();
  };
}
