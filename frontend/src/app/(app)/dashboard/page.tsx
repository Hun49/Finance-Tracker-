"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

type SummaryResponse = {
  currentBalance: number;
  thisMonth: { income: number; expenses: number; net: number };
  totalIncome: number;
  totalExpenses: number;
  startingBalance: number;
  debts: { owedToMe: number; iOwe: number; count: number };
  subscriptions: { active: number; monthlyTotal: number };
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

const quickActions = [
  { label: "Add income", href: "/income", tone: "bg-emerald-500" },
  { label: "Add expense", href: "/expenses", tone: "bg-rose-500" },
  { label: "Add subscription", href: "/subscriptions", tone: "bg-amber-400" },
  { label: "Track debt", href: "/debts", tone: "bg-blue-500" },
];

export default function DashboardPage() {
  const { profile } = useAuth();
  const currency = profile?.mainCurrency ?? "USD";

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "summary"],
    queryFn: () => api<SummaryResponse>("/reports/summary"),
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="glass-card h-40 animate-pulse rounded-3xl" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Estimated balance", value: formatMoney(data.currentBalance, currency), tone: "text-emerald-600 dark:text-emerald-400" },
    { label: "Income this month", value: formatMoney(data.thisMonth.income, currency), tone: "text-emerald-600 dark:text-emerald-400" },
    { label: "Expenses this month", value: formatMoney(data.thisMonth.expenses, currency), tone: "text-rose-600 dark:text-rose-400" },
    { label: "Net this month", value: formatMoney(data.thisMonth.net, currency), tone: data.thisMonth.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="glass-card rounded-3xl p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
            <p className={`mt-3 text-2xl font-black sm:text-3xl ${card.tone}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-3xl p-5">
        <p className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">Quick add</p>
        <div className="grid gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 transition hover:border-blue-300 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span className={`mb-3 block h-2.5 w-12 rounded-full ${action.tone}`} />
              <span className="text-sm font-bold">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-card rounded-3xl p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Debts outstanding</p>
          <p className="mt-3 text-3xl font-black text-blue-600 dark:text-blue-400">{data.debts.count}</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2 dark:bg-white/[0.03]">
              <span className="text-slate-500 dark:text-slate-400">People owe you</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">{formatMoney(data.debts.owedToMe, currency)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2 dark:bg-white/[0.03]">
              <span className="text-slate-500 dark:text-slate-400">You owe</span>
              <span className="font-black text-rose-600 dark:text-rose-400">{formatMoney(data.debts.iOwe, currency)}</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Active subscriptions</p>
          <p className="mt-3 text-3xl font-black text-amber-600 dark:text-amber-300">{data.subscriptions.active}</p>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Monthly total:{" "}
            <span className="font-black text-slate-950 dark:text-white">{formatMoney(data.subscriptions.monthlyTotal, currency)}</span>
          </p>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Lifetime totals</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2 dark:bg-white/[0.03]">
              <span className="text-slate-500 dark:text-slate-400">Income</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">{formatMoney(data.totalIncome, currency)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2 dark:bg-white/[0.03]">
              <span className="text-slate-500 dark:text-slate-400">Expenses</span>
              <span className="font-black text-rose-600 dark:text-rose-400">{formatMoney(data.totalExpenses, currency)}</span>
            </div>
            <p className="pt-2 text-xs text-slate-400">Started with {formatMoney(data.startingBalance, currency)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}