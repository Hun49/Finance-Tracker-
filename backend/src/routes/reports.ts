import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate";
import { prisma } from "../lib/prisma";
import { periodReport } from "../services/reportService";
import { asyncHandler } from "../utils/asyncHandler";
import { httpError } from "../utils/httpError";

export const reportsRouter = Router();

reportsRouter.use(authenticate);

type Money = { _sum: { convertedAmount: number | null } };

function parseDate(value: string | undefined | string[], label: string): Date {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || Number.isNaN(Date.parse(raw))) throw httpError(400, `Invalid ${label}`);
  return new Date(raw);
}

reportsRouter.get(
  "/daily",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!req.query.date) throw httpError(400, "date is required (YYYY-MM-DD)");
    const day = parseDate(req.query.date as string, "date");
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    res.json(await periodReport(authReq.user.id, start, end));
  }),
);

reportsRouter.get(
  "/weekly",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!req.query.date) throw httpError(400, "date is required (YYYY-MM-DD)");
    const day = parseDate(req.query.date as string, "date");
    const start = new Date(day);
    const dayOfWeek = start.getDay();
    start.setDate(day.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    res.json(await periodReport(authReq.user.id, start, end));
  }),
);

reportsRouter.get(
  "/monthly",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const query = z
      .object({ year: z.coerce.number().int().min(2000).max(2100), month: z.coerce.number().int().min(1).max(12) })
      .parse(req.query);
    const start = new Date(query.year, query.month - 1, 1);
    const end = new Date(query.year, query.month, 1);
    res.json(await periodReport(authReq.user.id, start, end));
  }),
);

reportsRouter.get(
  "/yearly",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const query = z.object({ year: z.coerce.number().int().min(2000).max(2100) }).parse(req.query);
    const start = new Date(query.year, 0, 1);
    const end = new Date(query.year + 1, 0, 1);
    res.json(await periodReport(authReq.user.id, start, end));
  }),
);

reportsRouter.get(
  "/custom",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!req.query.from || !req.query.to) throw httpError(400, "from and to are required (YYYY-MM-DD)");
    const from = parseDate(req.query.from as string, "from");
    const to = parseDate(req.query.to as string, "to");
    if (from >= to) throw httpError(400, "from must be before to");
    res.json(await periodReport(authReq.user.id, from, to));
  }),
);

reportsRouter.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;

    const [profile, incomes, expenses, subscriptions, debts] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.income.aggregate({ where: { userId }, _sum: { convertedAmount: true } }),
      prisma.expense.aggregate({ where: { userId }, _sum: { convertedAmount: true } }),
      prisma.subscription.findMany({ where: { userId, status: "ACTIVE" } }),
      prisma.debt.findMany({ where: { userId } }),
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [monthIncome, monthExpense] = await Promise.all([
      prisma.income.aggregate({
        where: { userId, date: { gte: monthStart, lt: nextMonthStart } },
        _sum: { convertedAmount: true },
      }) as Promise<Money>,
      prisma.expense.aggregate({
        where: { userId, date: { gte: monthStart, lt: nextMonthStart } },
        _sum: { convertedAmount: true },
      }) as Promise<Money>,
    ]);

    const startingBalance = profile ? Number(profile.startingBalance) : 0;
    const totalIncome = Number(incomes._sum.convertedAmount ?? 0);
    const totalExpenses = Number(expenses._sum.convertedAmount ?? 0);

    const debtsOwedToMe = debts
      .filter((debt) => debt.status !== "PAID" && debt.status !== "CANCELLED" && debt.type === "THEY_OWE_ME")
      .reduce((sum, debt) => sum + Number(debt.remainingAmount), 0);
    const debtsIOwe = debts
      .filter((debt) => debt.status !== "PAID" && debt.status !== "CANCELLED" && debt.type === "I_OWE_THEM")
      .reduce((sum, debt) => sum + Number(debt.remainingAmount), 0);

    const monthIncomeValue = Number(monthIncome._sum.convertedAmount ?? 0);
    const monthExpenseValue = Number(monthExpense._sum.convertedAmount ?? 0);

    const subscriptionMonthly = subscriptions
      .filter((sub) => sub.billingCycle === "MONTHLY")
      .reduce((sum, sub) => sum + Number(sub.convertedAmount), 0);

    res.json({
      currentBalance: startingBalance + totalIncome - totalExpenses,
      thisMonth: {
        income: monthIncomeValue,
        expenses: monthExpenseValue,
        net: monthIncomeValue - monthExpenseValue,
      },
      totalIncome,
      totalExpenses,
      startingBalance,
      debts: {
        owedToMe: debtsOwedToMe,
        iOwe: debtsIOwe,
        count: debts.filter((debt) => debt.status !== "PAID" && debt.status !== "CANCELLED").length,
      },
      subscriptions: {
        active: subscriptions.length,
        monthlyTotal: subscriptionMonthly,
      },
    });
  }),
);