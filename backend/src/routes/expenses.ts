import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate";
import { prisma } from "../lib/prisma";
import { convertToUserCurrency } from "../services/transactionService";
import { asyncHandler } from "../utils/asyncHandler";

export const expensesRouter = Router();

expensesRouter.use(authenticate);

const expenseSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  category: z.string().min(1).max(80),
  date: z.coerce.date(),
  frequency: z.enum(["ONCE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]).default("ONCE"),
  isRecurring: z.coerce.boolean().default(false),
  paymentMethod: z.string().max(80).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

async function findUsersExpense(userId: string, id: string) {
  const expense = await prisma.expense.findFirst({ where: { id, userId } });
  if (!expense) {
    const error = new Error("Expense not found") as Error & { status: number };
    error.status = 404;
    throw error;
  }
  return expense;
}

expensesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const expenses = await prisma.expense.findMany({
      where: { userId: authReq.user.id },
      orderBy: { date: "desc" },
    });
    res.json({ expenses });
  }),
);

expensesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const body = expenseSchema.parse(req.body);
    const conversion = await convertToUserCurrency(userId, { amount: body.amount, currency: body.currency });

    const expense = await prisma.expense.create({
      data: {
        userId,
        amount: conversion.amount,
        currency: conversion.currency,
        exchangeRate: conversion.exchangeRate,
        convertedAmount: conversion.convertedAmount,
        category: body.category,
        date: body.date,
        frequency: body.frequency,
        isRecurring: body.isRecurring,
        paymentMethod: body.paymentMethod ?? null,
        notes: body.notes ?? null,
      },
    });

    res.status(201).json({ expense });
  }),
);

expensesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const existing = await findUsersExpense(userId, String(req.params.id));
    const body = expenseSchema.partial().parse(req.body);

    let conversion: { amount: number; currency: string; exchangeRate: number; convertedAmount: number } | null = null;

    if (body.amount !== undefined || body.currency !== undefined) {
      conversion = await convertToUserCurrency(userId, {
        amount: body.amount ?? Number(existing.amount),
        currency: body.currency ?? existing.currency,
      });
    }

    const expense = await prisma.expense.update({
      where: { id: existing.id },
      data: {
        category: body.category,
        date: body.date,
        frequency: body.frequency,
        isRecurring: body.isRecurring,
        paymentMethod: body.paymentMethod ?? null,
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

    res.json({ expense });
  }),
);

expensesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const existing = await findUsersExpense(authReq.user.id, String(req.params.id));
    await prisma.expense.delete({ where: { id: existing.id } });
    res.status(204).send();
  }),
);