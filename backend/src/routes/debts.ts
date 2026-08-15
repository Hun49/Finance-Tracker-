import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate";
import { prisma } from "../lib/prisma";
import { convertToUserCurrency } from "../services/transactionService";
import { asyncHandler } from "../utils/asyncHandler";

export const debtsRouter = Router();

debtsRouter.use(authenticate);

const debtSchema = z.object({
  personName: z.string().min(1).max(120),
  type: z.enum(["THEY_OWE_ME", "I_OWE_THEM"]),
  originalAmount: z.coerce.number().positive(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  deadline: z.coerce.date().optional().nullable(),
  paymentPlan: z.string().max(300).optional().nullable(),
  status: z.enum(["ACTIVE", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  notes: z.string().max(500).optional().nullable(),
});

const DebtPaymentDirection = {
  PAID_BY_ME: "PAID_BY_ME",
  PAID_TO_ME: "PAID_TO_ME",
} as const;

type DebtPaymentDirection = (typeof DebtPaymentDirection)[keyof typeof DebtPaymentDirection];

const paymentSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  paymentDate: z.coerce.date(),
  notes: z.string().max(500).optional().nullable(),
});

async function findUsersDebt(userId: string, id: string) {
  const debt = await prisma.debt.findFirst({ where: { id, userId } });
  if (!debt) {
    const error = new Error("Debt not found") as Error & { status: number };
    error.status = 404;
    throw error;
  }
  return debt;
}

function directionForDebtType(type: "THEY_OWE_ME" | "I_OWE_THEM"): DebtPaymentDirection {
  return type === "THEY_OWE_ME" ? "PAID_TO_ME" : "PAID_BY_ME";
}

debtsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const debts = await prisma.debt.findMany({
      where: { userId: authReq.user.id },
      include: { payments: { orderBy: { paymentDate: "desc" } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ debts });
  }),
);

debtsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const debt = await prisma.debt.findFirst({
      where: { id: String(req.params.id), userId: authReq.user.id },
      include: { payments: { orderBy: { paymentDate: "desc" } } },
    });
    if (!debt) {
      const error = new Error("Debt not found") as Error & { status: number };
      error.status = 404;
      throw error;
    }
    res.json({ debt });
  }),
);

debtsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const body = debtSchema.parse(req.body);
    const conversion = await convertToUserCurrency(userId, { amount: body.originalAmount, currency: body.currency });

    const debt = await prisma.debt.create({
      data: {
        userId,
        personName: body.personName,
        type: body.type,
        originalAmount: conversion.amount,
        currency: conversion.currency,
        exchangeRate: conversion.exchangeRate,
        convertedOriginalAmount: conversion.convertedAmount,
        paidAmount: 0,
        remainingAmount: conversion.convertedAmount,
        deadline: body.deadline ?? null,
        paymentPlan: body.paymentPlan ?? null,
        status: "ACTIVE",
        notes: body.notes ?? null,
      },
    });

    res.status(201).json({ debt });
  }),
);

debtsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const existing = await findUsersDebt(userId, String(req.params.id));
    const body = debtSchema.partial().parse(req.body);

    let convertedOriginalAmount: number | null = null;
    let remainingAmount: number | null = null;

    if (body.originalAmount !== undefined || body.currency !== undefined) {
      const conversion = await convertToUserCurrency(userId, {
        amount: body.originalAmount ?? Number(existing.originalAmount),
        currency: body.currency ?? existing.currency,
      });
      convertedOriginalAmount = conversion.convertedAmount;
      remainingAmount = Math.max(0, conversion.convertedAmount - Number(existing.paidAmount));
    }

    const debt = await prisma.debt.update({
      where: { id: existing.id },
      data: {
        personName: body.personName,
        type: body.type,
        deadline: body.deadline ?? null,
        paymentPlan: body.paymentPlan ?? null,
        status: body.status,
        notes: body.notes ?? null,
        ...(body.originalAmount !== undefined || body.currency !== undefined
          ? {
              originalAmount: body.originalAmount ?? Number(existing.originalAmount),
              currency: body.currency ?? existing.currency,
              convertedOriginalAmount: convertedOriginalAmount ?? Number(existing.convertedOriginalAmount),
              remainingAmount: remainingAmount ?? Number(existing.remainingAmount),
            }
          : {}),
      },
    });

    res.json({ debt });
  }),
);

debtsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const existing = await findUsersDebt(authReq.user.id, String(req.params.id));
    await prisma.debt.delete({ where: { id: existing.id } });
    res.status(204).send();
  }),
);

debtsRouter.get(
  "/:id/payments",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const existing = await findUsersDebt(authReq.user.id, String(req.params.id));
    const payments = await prisma.debtPayment.findMany({
      where: { debtId: existing.id },
      orderBy: { paymentDate: "desc" },
    });
    res.json({ payments });
  }),
);

debtsRouter.post(
  "/:id/payments",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const existing = await findUsersDebt(userId, String(req.params.id));

    if (existing.status === "PAID" || existing.status === "CANCELLED") {
      const error = new Error("Cannot add payments to a paid or cancelled debt") as Error & { status: number };
      error.status = 400;
      throw error;
    }

    const body = paymentSchema.parse(req.body);
    const conversion = await convertToUserCurrency(userId, { amount: body.amount, currency: body.currency });

    const newPaidAmount = Number(existing.paidAmount) + conversion.convertedAmount;
    const remainingAmount = Math.max(0, Number(existing.convertedOriginalAmount) - newPaidAmount);
    const status = remainingAmount <= 0 ? "PAID" : "PARTIALLY_PAID";

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.debtPayment.create({
        data: {
          debtId: existing.id,
          userId,
          amount: conversion.amount,
          currency: conversion.currency,
          exchangeRate: conversion.exchangeRate,
          convertedAmount: conversion.convertedAmount,
          paymentDate: body.paymentDate,
          direction: directionForDebtType(existing.type),
          notes: body.notes ?? null,
        },
      });

      await tx.debt.update({
        where: { id: existing.id },
        data: { paidAmount: newPaidAmount, remainingAmount, status },
      });

      return created;
    });

    res.status(201).json({ payment });
  }),
);