/** Responsibility: translate auth HTTP requests into service calls and safe responses. */
import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
export const authController = {
  register: async (_req: Request, res: Response, _next: NextFunction) => res.status(501).json({ error: { code: "NOT_IMPLEMENTED", message: "Registration is not implemented" } }),
  login: async (_req: Request, res: Response, _next: NextFunction) => res.status(501).json({ error: { code: "NOT_IMPLEMENTED", message: "Login is not implemented" } }),
};
void authService;
