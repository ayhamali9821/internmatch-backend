/** Responsibility: verify the bearer JWT and attach its trusted identity to the request. */
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string };
}
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) { res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Authentication required" } }); return; }
  try {
    const claims = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    if (typeof claims.sub !== "string" || typeof claims.role !== "string") throw new Error("Invalid token claims");
    req.user = { id: claims.sub, role: claims.role };
    next();
  } catch { res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Authentication required" } }); }
}
