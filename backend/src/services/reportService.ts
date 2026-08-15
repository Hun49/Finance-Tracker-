import { prisma } from "../lib/prisma";

export type MoneyAggregate = {
  income: number;
  expenses: number;
};

export async function rangeTotals(userId: string, start: Date, end: Date): Promise<MoneyAggregate> {
  const income = await prisma.income.aggregate({
    where: { userId, date: { gte: start, lt: end } },
    _sum: { convertedAmount: true },
  });
  const expense = await prisma.expense.aggregate({
    where: { userId, date: { gte: start, lt: end } },
    _sum: { convertedAmount: true },
  });

  return {
    income: Number(income._sum.convertedAmount ?? 0),
    expenses: Number(expense._sum.convertedAmount ?? 0),
  };
}

export async function categoryTotals(userId: string, start: Date, end: Date) {
  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: start, lt: end } },
    select: { category: true, convertedAmount: true },
  });

  const byCategory = new Map<string, number>();
  for (const expense of expenses) {
    byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + Number(expense.convertedAmount));
  }

  return Array.from(byCategory.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export async function periodSubscriptionTotals(userId: string, start: Date, end: Date) {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId, status: "ACTIVE" },
  });

  const monthCount = Math.max(
    1,
    (end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000),
  );

  const total = subscriptions.reduce((sum, subscription) => {
    const monthly = normalizeToMonthly(Number(subscription.convertedAmount), subscription.billingCycle, subscription.nextPaymentDate);
    return sum + monthly * monthCount;
  }, 0);

  return total;
}

export function normalizeToMonthly(amount: number, cycle: string, nextPaymentDate: Date): number {
  switch (cycle) {
    case "DAILY":
      return amount * 30;
    case "WEEKLY":
      return amount * 4.33;
    case "YEARLY":
      return amount / 12;
    case "MONTHLY":
    default:
      return amount;
  }
}

export async function periodDebtPayments(userId: string, start: Date, end: Date) {
  const payments = await prisma.debtPayment.findMany({
    where: { userId, paymentDate: { gte: start, lt: end } },
  });

  const paidByMe = payments
    .filter((payment) => payment.direction === "PAID_BY_ME")
    .reduce((sum, payment) => sum + Number(payment.convertedAmount), 0);
  const paidToMe = payments
    .filter((payment) => payment.direction === "PAID_TO_ME")
    .reduce((sum, payment) => sum + Number(payment.convertedAmount), 0);

  return { paidByMe, paidToMe };
}

export async function periodReport(userId: string, start: Date, end: Date) {
  const totals = await rangeTotals(userId, start, end);
  const byCategory = await categoryTotals(userId, start, end);
  const subscriptions = await periodSubscriptionTotals(userId, start, end);
  const debts = await periodDebtPayments(userId, start, end);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    income: totals.income,
    expenses: totals.expenses,
    net: totals.income - totals.expenses,
    topCategories: byCategory,
    subscriptions,
    debts,
  };
}