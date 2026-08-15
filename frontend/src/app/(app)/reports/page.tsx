"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { useQuery } from "@tanstack/react-query";

type Report = {
  start: string;
  end: string;
  income: number;
  expenses: number;
  net: number;
  topCategories: Array<{ category: string; amount: number }>;
  subscriptions: number;
  debts: { paidByMe: number; paidToMe: number };
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

const tabs = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
  { id: "custom", label: "Custom" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function ReportsPage() {
  const { profile } = useAuth();
  const currency = profile?.mainCurrency ?? "USD";

  const [tab, setTab] = useState<TabId>("monthly");
  const [date, setDate] = useState(todayISO());
  const { year, month } = currentMonth();
  const [reportYear, setReportYear] = useState(year);
  const [reportMonth, setReportMonth] = useState(month);
  const [customFrom, setCustomFrom] = useState(todayISO());
  const [customTo, setCustomTo] = useState(todayISO());

  const queryKey = ["reports", tab, tab === "daily" || tab === "weekly" ? date : tab === "monthly" ? `${reportYear}-${reportMonth}` : tab === "yearly" ? reportYear : `${customFrom}|${customTo}`];

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => {
      switch (tab) {
        case "daily":
          return api<Report>(`/reports/daily?date=${date}`);
        case "weekly":
          return api<Report>(`/reports/weekly?date=${date}`);
        case "monthly":
          return api<Report>(`/reports/monthly?year=${reportYear}&month=${reportMonth}`);
        case "yearly":
          return api<Report>(`/reports/yearly?year=${reportYear}`);
        case "custom":
          return api<Report>(`/reports/custom?from=${customFrom}&to=${customTo}`);
      }
    },
  });

  const totalCategories = data?.topCategories.reduce((sum, item) => sum + item.amount, 0) ?? 0;

  return (
    <div className="space-y-5">
      <div className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Daily, weekly, monthly, yearly, and custom totals. Based only on your entered data.
          </p>
        </div>
        <Link href="/dashboard" className="rounded-full border border-slate-200 bg-white/70 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          Dashboard
        </Link>
      </div>

      <div className="glass-card flex gap-1 overflow-x-auto rounded-3xl p-1.5">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`whitespace-nowrap rounded-2xl px-5 py-2.5 text-sm font-semibold transition ${
              tab === item.id ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-white/60 dark:text-slate-300"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-3xl p-4">
        {tab === "daily" || tab === "weekly" ? (
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {tab === "daily" ? "Date" : "Any date in the week"}
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold shadow-sm outline-none dark:border-white/10 dark:bg-white/[0.04]" />
          </label>
        ) : null}

        {tab === "monthly" ? (
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <span>Month</span>
            <select value={reportMonth} onChange={(event) => setReportMonth(Number(event.target.value))} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold shadow-sm outline-none dark:border-white/10 dark:bg-white/[0.04]">
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index} value={index + 1}>
                  {new Date(reportYear, index, 1).toLocaleString("en", { month: "long" })}
                </option>
              ))}
            </select>
            <select value={reportYear} onChange={(event) => setReportYear(Number(event.target.value))} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold shadow-sm outline-none dark:border-white/10 dark:bg-white/[0.04]">
              {Array.from({ length: 8 }, (_, index) => new Date().getFullYear() - 2 + index).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {tab === "yearly" ? (
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <span>Year</span>
            <select value={reportYear} onChange={(event) => setReportYear(Number(event.target.value))} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold shadow-sm outline-none dark:border-white/10 dark:bg-white/[0.04]">
              {Array.from({ length: 10 }, (_, index) => new Date().getFullYear() - 3 + index).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {tab === "custom" ? (
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <span>From</span>
            <input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold shadow-sm outline-none dark:border-white/10 dark:bg-white/[0.04]" />
            <span>to</span>
            <input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold shadow-sm outline-none dark:border-white/10 dark:bg-white/[0.04]" />
          </div>
        ) : null}
      </div>

      {isLoading || isFetching ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-3xl bg-white/50 dark:bg-white/[0.03]" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass-card rounded-3xl p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Income</p>
              <p className="mt-3 text-3xl font-black text-emerald-600 dark:text-emerald-400">{formatMoney(data.income, currency)}</p>
            </div>
            <div className="glass-card rounded-3xl p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Expenses</p>
              <p className="mt-3 text-3xl font-black text-rose-600 dark:text-rose-400">{formatMoney(data.expenses, currency)}</p>
            </div>
            <div className="glass-card rounded-3xl p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Net result</p>
              <p className={`mt-3 text-3xl font-black ${data.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {data.net >= 0 ? "+" : ""}
                {formatMoney(data.net, currency)}
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="glass-card rounded-3xl p-6">
              <h2 className="mb-4 font-black">Top spending categories</h2>
              {data.topCategories.length === 0 ? (
                <p className="text-sm text-slate-400">No expenses in this period.</p>
              ) : (
                <div className="space-y-3">
                  {data.topCategories.map((item) => (
                    <div key={item.category}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-semibold">{item.category}</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">{formatMoney(item.amount, currency)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-rose-500"
                          style={{ width: `${totalCategories ? (item.amount / totalCategories) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card rounded-3xl p-6">
              <h2 className="mb-4 font-black">Period summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-3 dark:bg-white/[0.03]">
                  <span className="text-slate-500 dark:text-slate-400">Subscriptions (est.)</span>
                  <span className="font-black text-amber-600 dark:text-amber-300">{formatMoney(data.subscriptions, currency)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-3 dark:bg-white/[0.03]">
                  <span className="text-slate-500 dark:text-slate-400">Debt payments made</span>
                  <span className="font-black text-rose-600 dark:text-rose-400">{formatMoney(data.debts.paidByMe, currency)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-3 dark:bg-white/[0.03]">
                  <span className="text-slate-500 dark:text-slate-400">Debt payments received</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">{formatMoney(data.debts.paidToMe, currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}