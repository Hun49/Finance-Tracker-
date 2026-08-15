import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { httpError } from "../utils/httpError";
import { sendVerificationEmail } from "./emailService";

const verificationExpiryMinutes = 10;
const maxAttempts = 5;

export function generateVerificationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

export async function createAndSendVerificationCode(userId: string, email: string, name: string) {
  const code = generateVerificationCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + verificationExpiryMinutes * 60 * 1000);

  await prisma.emailVerificationCode.create({
    data: { userId, codeHash, expiresAt },
  });

  await sendVerificationEmail(email, name, code);
}

export async function verifyEmailCode(userId: string, code: string) {
  const storedCode = await prisma.emailVerificationCode.findFirst({
    where: {
      userId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!storedCode) throw httpError(400, "Verification code is invalid or expired");
  if (storedCode.attemptCount >= maxAttempts) throw httpError(429, "Too many verification attempts");

  const isValid = await bcrypt.compare(code, storedCode.codeHash);

  if (!isValid) {
    await prisma.emailVerificationCode.update({
      where: { id: storedCode.id },
      data: { attemptCount: { increment: 1 } },
    });
    throw httpError(400, "Verification code is incorrect");
  }

  await prisma.$transaction([
    prisma.emailVerificationCode.update({ where: { id: storedCode.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } }),
  ]);
}
