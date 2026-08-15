import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { verifyAccessToken } from "../services/tokenService";
import { httpError } from "../utils/httpError";

export type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email: string;
    name: string;
  };
};

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) throw httpError(401, "Authentication required");

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) throw httpError(401, "Authentication required");

    (req as AuthenticatedRequest).user = { id: user.id, email: user.email, name: user.name };
    next();
  } catch (error) {
    next(httpError(401, "Authentication required"));
  }
}
