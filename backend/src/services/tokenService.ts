import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";

const accessTokenExpiry = "15m";
const refreshTokenDays = 30;

export type AccessTokenPayload = {
  sub: string;
  email: string;
};

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: accessTokenExpiry });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createRefreshToken(userId: string) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + refreshTokenDays * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  return token;
}

export async function rotateRefreshToken(token: string) {
  const tokenHash = hashToken(token);
  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!storedToken) return null;

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  const refreshToken = await createRefreshToken(storedToken.userId);
  const accessToken = signAccessToken({ sub: storedToken.userId, email: storedToken.user.email });

  return { accessToken, refreshToken, user: storedToken.user };
}

export async function revokeRefreshToken(token: string) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
