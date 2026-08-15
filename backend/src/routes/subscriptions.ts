import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate";
import { prisma } from "../lib/prisma";
import { convertToUserCurrency } from "../services/transactionService";
import { asyncHandler } from "../utils/asyncHandler";

export const subscriptionsRouter = Router();

subscriptionsRouter.use(authenticate);

const subscriptionSchema = z.object({
  name: z.string().min(1).max(120),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  billingCycle: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  nextPaymentDate: z.coerce.date(),
  category: z.string().min(1).max(80),
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).default("ACTIVE"),
  notes: z.string().max(500).optional().nullable(),
});

async function findUsersSubscription(userId: string, id: string) {
  const subscription = await prisma.subscription.findFirst({ where: { id, userId } });
  if (!subscription) {
    const error = new Error("Subscription not found") as Error & { status: number };
    error.status = 404;
    throw error;
  }
  return subscription;
}

subscriptionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: authReq.user.id },
      orderBy: { nextPaymentDate: "asc" },
    });
    res.json({ subscriptions });
  }),
);

subscriptionsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const body = subscriptionSchema.parse(req.body);
    const conversion = await convertToUserCurrency(userId, { amount: body.amount, currency: body.currency });

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        name: body.name,
        amount: conversion.amount,
        currency: conversion.currency,
        exchangeRate: conversion.exchangeRate,
        convertedAmount: conversion.convertedAmount,
        billingCycle: body.billingCycle,
        nextPaymentDate: body.nextPaymentDate,
        category: body.category,
        status: body.status,
        notes: body.notes ?? null,
      },
    });

    res.status(201).json({ subscription });
  }),
);

subscriptionsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const existing = await findUsersSubscription(userId, String(req.params.id));
    const body = subscriptionSchema.partial().parse(req.body);

    let conversion: { amount: number; currency: string; exchangeRate: number; convertedAmount: number } | null = null;

    if (body.amount !== undefined || body.currency !== undefined) {
      conversion = await convertToUserCurrency(userId, {
        amount: body.amount ?? Number(existing.amount),
        currency: body.currency ?? existing.currency,
      });
    }

    const subscription = await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        name: body.name,
        billingCycle: body.billingCycle,
        nextPaymentDate: body.nextPaymentDate,
        category: body.category,
        status: body.status,
        notes: body.notes ?? null,
        ...(conversion
          ? {
              amount: conversion.amount,
              currency: conversion.currency,
              exchangeRate: conversion.exchangeRate,
              convertedAmount: conversion.convertedAmount,
            }
          : {}),
      },
    });

    res.json({ subscription });
  }),
);

subscriptionsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const existing = await findUsersSubscription(authReq.user.id, String(req.params.id));
    await prisma.subscription.delete({ where: { id: existing.id } });
    res.status(204).send();
  }),
);