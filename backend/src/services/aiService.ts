import { env } from "../config/env";
import { prisma } from "../lib/prisma";

type GoogleGenAI = InstanceType<typeof import("@google/genai", { with: { "resolution-mode": "import" } }).GoogleGenAI>;

export function isAiConfigured(): boolean {
  return Boolean(env.GEMINI_API_KEY);
}

async function getGoogleGenAI(): Promise<GoogleGenAI> {
  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
}

function money(value: unknown): number {
  return Number(value ?? 0);
}

export async function buildFinancialContext(userId: string) {
  const [profile, user, incomes, expenses, subscriptions, debts, plans] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.income.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 100 }),
    prisma.expense.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 200 }),
    prisma.subscription.findMany({ where: { userId } }),
    prisma.debt.findMany({
      where: { userId },
      include: { payments: { orderBy: { paymentDate: "desc" }, take: 10 } },
    }),
    prisma.monthlyPlan.findMany({ where: { userId }, orderBy: [{ year: "desc" }, { month: "desc" }], take: 6 }),
  ]);

  const mainCurrency = profile?.mainCurrency ?? "USD";
  const totalIncome = incomes.reduce((sum, item) => sum + money(item.convertedAmount), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + money(item.convertedAmount), 0);

  const byCategory = new Map<string, number>();
  for (const expense of expenses) {
    byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + money(expense.convertedAmount));
  }

  const debtsOwedToMe = debts
    .filter((debt) => debt.status !== "PAID" && debt.status !== "CANCELLED" && debt.type === "THEY_OWE_ME")
    .reduce((sum, debt) => sum + money(debt.remainingAmount), 0);
  const debtsIOwe = debts
    .filter((debt) => debt.status !== "PAID" && debt.status !== "CANCELLED" && debt.type === "I_OWE_THEM")
    .reduce((sum, debt) => sum + money(debt.remainingAmount), 0);

  return {
    user: { name: user?.name ?? "user", email: user?.email ?? "" },
    mainCurrency,
    startingBalance: money(profile?.startingBalance),
    estimatedBalance: money(profile?.startingBalance) + totalIncome - totalExpenses,
    totals: { income: totalIncome, expenses: totalExpenses, net: totalIncome - totalExpenses },
    topCategories: Array.from(byCategory.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10),
    subscriptions: subscriptions.map((subscription) => ({
      name: subscription.name,
      category: subscription.category,
      billingCycle: subscription.billingCycle,
      amount: money(subscription.convertedAmount),
      status: subscription.status,
      nextPaymentDate: subscription.nextPaymentDate.toISOString().slice(0, 10),
    })),
    debts: debts.map((debt) => ({
      personName: debt.personName,
      type: debt.type,
      status: debt.status,
      original: money(debt.convertedOriginalAmount),
      remaining: money(debt.remainingAmount),
      deadline: debt.deadline ? debt.deadline.toISOString().slice(0, 10) : null,
      paymentPlan: debt.paymentPlan,
    })),
    debtsSummary: { owedToMe: debtsOwedToMe, iOwe: debtsIOwe },
    recentIncome: incomes.slice(0, 15).map((item) => ({
      source: item.source,
      category: item.category,
      amount: money(item.convertedAmount),
      date: item.date.toISOString().slice(0, 10),
    })),
    recentExpenses: expenses.slice(0, 30).map((item) => ({
      category: item.category,
      amount: money(item.convertedAmount),
      date: item.date.toISOString().slice(0, 10),
      frequency: item.frequency,
    })),
    plans: plans.map((plan) => ({
      month: plan.month,
      year: plan.year,
      expectedIncome: money(plan.expectedIncome),
      plannedExpenses: money(plan.plannedExpenses),
      plannedSubscriptions: money(plan.plannedSubscriptions),
      plannedDebtPayments: money(plan.plannedDebtPayments),
      savingsGoal: money(plan.savingsGoal),
      emergencyFundGoal: money(plan.emergencyFundGoal),
    })),
  };
}

const SYSTEM_PROMPT = `You are "Finora", a helpful and concise personal finance assistant.
You help the user understand and improve their finances based on the data they manually track: income, expenses, subscriptions, debts, and monthly plans.
Rules:
- Answer only from the provided financial context. If the user asks something not in the data, say you don't have that information.
- Use the user's main currency when mentioning amounts. Be direct and give actionable advice.
- If they ask for specific numbers, compute them from the data.
- Keep answers concise but complete. Use short markdown bullet lists when helpful.
- Only use the numeric fields you are told about; never invent figures.`;

export async function askFinanceAssistant(userId: string, question: string): Promise<string> {
  const context = await buildFinancialContext(userId);

  if (!env.GEMINI_API_KEY) {
    return (
      `The Gemini AI assistant is not configured yet.\n\n` +
      `Add a GEMINI_API_KEY to backend/.env and restart the backend to enable live answers. ` +
      `In the meantime, here is a plain summary of your tracked data:\n\n` +
      `- Main currency: ${context.mainCurrency}\n` +
      `- Estimated balance: ${money(context.estimatedBalance).toLocaleString()}\n` +
      `- Total income: ${money(context.totals.income).toLocaleString()}\n` +
      `- Total expenses: ${money(context.totals.expenses).toLocaleString()}\n` +
      `- Net: ${money(context.totals.net).toLocaleString()}\n` +
      `- Active subscriptions: ${context.subscriptions.filter((item) => item.status === "ACTIVE").length}\n` +
      `- Debts owed to you: ${money(context.debtsSummary.owedToMe).toLocaleString()}\n` +
      `- Debts you owe: ${money(context.debtsSummary.iOwe).toLocaleString()}`
    );
  }

  const contextText = JSON.stringify(context, null, 2);
  const userMessage = [
    `Financial context (JSON):\n${contextText}`,
    "",
    `Question: ${question}`,
  ].join("\n");

  const ai = await getGoogleGenAI();
  const response = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: userMessage,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: 1024,
      temperature: 0.4,
    },
  });

  return response.text ?? "Sorry, I couldn't generate a response.";
}