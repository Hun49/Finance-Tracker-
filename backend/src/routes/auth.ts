import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate";
import { prisma } from "../lib/prisma";
import { createRefreshToken, revokeRefreshToken, rotateRefreshToken, signAccessToken } from "../services/tokenService";
import { createAndSendVerificationCode, verifyEmailCode } from "../services/verificationService";
import { asyncHandler } from "../utils/asyncHandler";
import { httpError } from "../utils/httpError";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(1),
});

const verifyEmailSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase()),
  code: z.string().regex(/^\d{6}$/),
});

const refreshSchema = z.object({ refreshToken: z.string().min(20) });

function publicUser(user: { id: string; name: string; email: string; emailVerifiedAt: Date | null }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
  };
}

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });

    if (existingUser) throw httpError(409, "An account with this email already exists");

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: { name: body.name, email: body.email, passwordHash },
    });

    await createAndSendVerificationCode(user.id, user.email, user.name);

    res.status(201).json({
      message: "Account created. Check your email for the verification code.",
      user: publicUser(user),
    });
  }),
);

authRouter.post(
  "/verify-email",
  asyncHandler(async (req, res) => {
    const body = verifyEmailSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });

    if (!user) throw httpError(404, "User not found");

    await verifyEmailCode(user.id, body.code);

    const updatedUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const accessToken = signAccessToken({ sub: updatedUser.id, email: updatedUser.email });
    const refreshToken = await createRefreshToken(updatedUser.id);

    res.json({ user: publicUser(updatedUser), accessToken, refreshToken });
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });

    if (!user) throw httpError(401, "Invalid email or password");

    const passwordMatches = await bcrypt.compare(body.password, user.passwordHash);
    if (!passwordMatches) throw httpError(401, "Invalid email or password");
    if (!user.emailVerifiedAt) throw httpError(403, "Please verify your email before logging in");

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = await createRefreshToken(user.id);

    res.json({ user: publicUser(user), accessToken, refreshToken });
  }),
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const body = refreshSchema.parse(req.body);
    const session = await rotateRefreshToken(body.refreshToken);

    if (!session) throw httpError(401, "Invalid refresh token");

    res.json({
      user: publicUser(session.user),
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const body = refreshSchema.parse(req.body);
    await revokeRefreshToken(body.refreshToken);
    res.status(204).send();
  }),
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const user = await prisma.user.findUniqueOrThrow({ where: { id: authReq.user.id } });
    const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });

    res.json({ user: publicUser(user), profile });
  }),
);
