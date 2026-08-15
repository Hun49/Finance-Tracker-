import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate";
import { prisma } from "../lib/prisma";
import { convertToUserCurrency } from "../services/transactionService";
import { asyncHandler } from "../utils/asyncHandler";

export const incomeRouter = Router();

incomeRouter.use(authenticate);

const incomeSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  source: z.string().min(1).max(120),
  category: z.string().min(1).max(80),
  date: z.coerce.date(),
  frequency: z.enum(["ONCE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]).default("ONCE"),
  isRecurring: z.coerce.boolean().default(false),
  notes: z.string().max(500).optional().nullable(),
});

async function findUsersIncome(userId: string, id: string) {
  const income = await prisma.income.findFirst({ where: { id, userId } });
  if (!income) {
    const error = new Error("Income not found") as Error & { status: number };
    error.status = 404;
    throw error;
  }
  return income;
}

incomeRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const incomes = await prisma.income.findMany({
      where: { userId: authReq.user.id },
      orderBy: { date: "desc" },
    });
    res.json({ incomes });
  }),
);

incomeRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const body = incomeSchema.parse(req.body);
    const conversion = await convertToUserCurrency(userId, { amount: body.amount, currency: body.currency });

    const income = await prisma.income.create({
      data: {
        userId,
        amount: conversion.amount,
        currency: conversion.currency,
        exchangeRate: conversion.exchangeRate,
        convertedAmount: conversion.convertedAmount,
        source: body.source,
        category: body.category,
        date: body.date,
        frequency: body.frequency,
        isRecurring: body.isRecurring,
        notes: body.notes ?? null,
      },
    });

    res.status(201).json({ income });
  }),
);

incomeRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const existing = await findUsersIncome(userId, String(req.params.id));
    const body = incomeSchema.partial().parse(req.body);

    let conversion: { amount: number; currency: string; exchangeRate: number; convertedAmount: number } | null = null;

    if (body.amount !== undefined || body.currency !== undefined) {
      conversion = await convertToUserCurrency(userId, {
        amount: body.amount ?? Number(existing.amount),
        currency: body.currency ?? existing.currency,
      });
    }

    const income = await prisma.income.update({
      where: { id: existing.id },
      data: {
        source: body.source,
        category: body.category,
        date: body.date,
        frequency: body.frequency,
        isRecurring: body.isRecurring,
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

    res.json({ income });
  }),
);

incomeRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const existing = await findUsersIncome(authReq.user.id, String(req.params.id));
    await prisma.income.delete({ where: { id: existing.id } });
    res.status(204).send();
  }),
);