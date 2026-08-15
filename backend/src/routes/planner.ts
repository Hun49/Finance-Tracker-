import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";

export const plannerRouter = Router();

plannerRouter.use(authenticate);

const planSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  expectedIncome: z.coerce.number(),
  plannedExpenses: z.coerce.number(),
  plannedSubscriptions: z.coerce.number(),
  plannedDebtPayments: z.coerce.number(),
  savingsGoal: z.coerce.number(),
  emergencyFundGoal: z.coerce.number(),
  notes: z.string().max(500).optional().nullable(),
});

plannerRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const plans = await prisma.monthlyPlan.findMany({
      where: { userId: authReq.user.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    res.json({ plans });
  }),
);

plannerRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const body = planSchema.parse(req.body);

    const plan = await prisma.monthlyPlan.upsert({
      where: { userId_month_year: { userId, month: body.month, year: body.year } },
      create: {
        userId,
        month: body.month,
        year: body.year,
        expectedIncome: body.expectedIncome,
        plannedExpenses: body.plannedExpenses,
        plannedSubscriptions: body.plannedSubscriptions,
        plannedDebtPayments: body.plannedDebtPayments,
        savingsGoal: body.savingsGoal,
        emergencyFundGoal: body.emergencyFundGoal,
        notes: body.notes ?? null,
      },
      update: {
        expectedIncome: body.expectedIncome,
        plannedExpenses: body.plannedExpenses,
        plannedSubscriptions: body.plannedSubscriptions,
        plannedDebtPayments: body.plannedDebtPayments,
        savingsGoal: body.savingsGoal,
        emergencyFundGoal: body.emergencyFundGoal,
        notes: body.notes ?? null,
      },
    });

    res.status(201).json({ plan });
  }),
);

plannerRouter.post(
  "/delete",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const body = z.object({ month: z.coerce.number().int(), year: z.coerce.number().int() }).parse(req.body);

    await prisma.monthlyPlan.deleteMany({
      where: { userId, month: body.month, year: body.year },
    });

    res.status(204).send();
  }),
);

plannerRouter.get(
  "/summary/:year/:month",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const year = Number(req.params.year);
    const month = Number(req.params.month);

    const monthStart = new Date(year, month - 1, 1);
    const nextMonthStart = new Date(year, month, 1);

    const plan = await prisma.monthlyPlan.findUnique({
      where: { userId_month_year: { userId, month, year } },
    });

    const [incomeResult, expenseResult] = await Promise.all([
      prisma.income.aggregate({
        where: { userId, date: { gte: monthStart, lt: nextMonthStart } },
        _sum: { convertedAmount: true },
      }),
      prisma.expense.aggregate({
        where: { userId, date: { gte: monthStart, lt: nextMonthStart } },
        _sum: { convertedAmount: true },
      }),
    ]);

    const debtPayments = await prisma.debtPayment.findMany({
      where: { userId, paymentDate: { gte: monthStart, lt: nextMonthStart } },
    });

    const paidByMe = debtPayments
      .filter((payment) => payment.direction === "PAID_BY_ME")
      .reduce((sum, payment) => sum + Number(payment.convertedAmount), 0);
    const paidToMe = debtPayments
      .filter((payment) => payment.direction === "PAID_TO_ME")
      .reduce((sum, payment) => sum + Number(payment.convertedAmount), 0);

    const actualIncome = Number(incomeResult._sum.convertedAmount ?? 0);
    const actualExpenses = Number(expenseResult._sum.convertedAmount ?? 0);

    res.json({
      plan,
      actual: {
        income: actualIncome,
        expenses: actualExpenses,
        net: actualIncome - actualExpenses,
        debtPaid: paidByMe,
        debtReceived: paidToMe,
      },
      planned: plan
        ? {
            expectedIncome: Number(plan.expectedIncome),
            plannedExpenses: Number(plan.plannedExpenses),
            plannedSubscriptions: Number(plan.plannedSubscriptions),
            plannedDebtPayments: Number(plan.plannedDebtPayments),
            savingsGoal: Number(plan.savingsGoal),
            emergencyFundGoal: Number(plan.emergencyFundGoal),
            remaining: Number(plan.expectedIncome) - Number(plan.plannedExpenses) - Number(plan.plannedSubscriptions) - Number(plan.plannedDebtPayments) - (Number(plan.savingsGoal) > 0 ? Number(plan.savingsGoal) : 0),
          }
        : null,
    });
  }),
);