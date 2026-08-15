"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Field, PrimaryButton, Textarea, TextInput } from "../../../components/ui";
import { api, jsonPost } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

type Plan = {
  id: string;
  month: number;
  year: number;
  expectedIncome: number | string;
  plannedExpenses: number | string;
  plannedSubscriptions: number | string;
  plannedDebtPayments: number | string;
  savingsGoal: number | string;
  emergencyFundGoal: number | string;
  notes: string | null;
};

type Summary = {
  plan: Plan | null;
  planned: { expectedIncome: number; plannedExpenses: number; plannedSubscriptions: number; plannedDebtPayments: number; savingsGoal: number; remaining: number } | null;
  actual: { income: number; expenses: number; net: number; debtPaid: number; debtReceived: number };
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function PlannerPage() {
  const { profile } = useAuth();
  const currency = profile?.mainCurrency ?? "USD";
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const queryClient = useQueryClient();

  const { data: summary } = useQuery({
    queryKey: ["planner", "summary", year, month],
    queryFn: () => api<Summary>(`/planner/summary/${year}/${month}`),
  });

  const plan = summary?.plan ?? null;

  const [expectedIncome, setExpectedIncome] = useState("");
  const [plannedExpenses, setPlannedExpenses] = useState("");
  const [plannedSubscriptions, setPlannedSubscriptions] = useState("");
  const [plannedDebtPayments, setPlannedDebtPayments] = useState("");
  const [savingsGoal, setSavingsGoal] = useState("");
  const [emergencyFundGoal, setEmergencyFundGoal] = useState("");
  const [notes, setNotes] = useState("");

  const saveMutation = useMutation({
    mutationFn: () =>
      api(
        "/planner",
        jsonPost({
          month,
          year,
          expectedIncome: Number(expectedIncome) || 0,
          plannedExpenses: Number(plannedExpenses) || 0,
          plannedSubscriptions: Number(plannedSubscriptions) || 0,
          plannedDebtPayments: Number(plannedDebtPayments) || 0,
          savingsGoal: Number(savingsGoal) || 0,
          emergencyFundGoal: Number(emergencyFundGoal) || 0,
          notes: notes || null,
        }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner"] });
      setPlanFields(summary?.plan);
    },
  });

  function selectPlan(selected: Plan | null | undefined) {
    setPlanFields(selected ?? null);
  }

  function setPlanFields(selected: Plan | null | undefined) {
    setExpectedIncome(selected ? String(Number(selected.expectedIncome)) : "");
    setPlannedExpenses(selected ? String(Number(selected.plannedExpenses)) : "");
    setPlannedSubscriptions(selected ? String(Number(selected.plannedSubscriptions)) : "");
    setPlannedDebtPayments(selected ? String(Number(selected.plannedDebtPayments)) : "");
    setSavingsGoal(selected ? String(Number(selected.savingsGoal)) : "");
    setEmergencyFundGoal(selected ? String(Number(selected.emergencyFundGoal)) : "");
    setNotes(selected?.notes ?? "");
  }

  const { data: plansData } = useQuery({
    queryKey: ["planner", "list"],
    queryFn: () => api<{ plans: Plan[] }>("/planner"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api("/planner/delete", jsonPost({ month, year })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner"] });
    },
  });

  const plans = plansData?.plans ?? [];

  return (
    <div className="space-y-5">
      <div className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Monthly planner</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Plan income, expenses, debts, and savings. Compare planned vs actual.</p>
        </div>
        <Link href="/dashboard" className="rounded-full border border-slate-200 bg-white/70 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          Dashboard
        </Link>
      </div>

      <div className="glass-card flex flex-wrap items-center gap-3 rounded-3xl p-4">
        <SelectMonth year={year} setYear={setYear} />
        <SelectMonthNumber month={month} setMonth={setMonth} />
        <button
          onClick={() => selectPlan(summary?.plan)}
          className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 dark:border-white/10 dark:bg-white/5"
        >
          Load saved plan
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate();
          }}
          className="glass-card space-y-5 rounded-3xl p-6"
        >
          <h2 className="font-black">
            Plan {monthNames[month - 1]} {year}
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Expected income">
              <TextInput type="number" step="0.01" min="0" value={expectedIncome} onChange={(event) => setExpectedIncome(event.target.value)} />
            </Field>
            <Field label="Planned expenses">
              <TextInput type="number" step="0.01" min="0" value={plannedExpenses} onChange={(event) => setPlannedExpenses(event.target.value)} />
            </Field>
            <Field label="Planned subscriptions">
              <TextInput type="number" step="0.01" min="0" value={plannedSubscriptions} onChange={(event) => setPlannedSubscriptions(event.target.value)} />
            </Field>
            <Field label="Planned debt payments">
              <TextInput type="number" step="0.01" min="0" value={plannedDebtPayments} onChange={(event) => setPlannedDebtPayments(event.target.value)} />
            </Field>
            <Field label="Savings goal">
              <TextInput type="number" step="0.01" min="0" value={savingsGoal} onChange={(event) => setSavingsGoal(event.target.value)} />
            </Field>
            <Field label="Emergency fund goal">
              <TextInput type="number" step="0.01" min="0" value={emergencyFundGoal} onChange={(event) => setEmergencyFundGoal(event.target.value)} />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="Optional notes…" />
          </Field>

          <div className="flex gap-3">
            <PrimaryButton type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : plan ? "Update plan" : "Save plan"}
            </PrimaryButton>
            {plans.some((item) => item.month === month && item.year === year) ? (
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                className="rounded-full bg-rose-500/10 px-6 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-300"
              >
                Clear month
              </button>
            ) : null}
          </div>
        </form>

        <div className="space-y-5">
          {summary?.planned ? (
            <div className="glass-card rounded-3xl p-6">
              <h3 className="mb-4 font-black">Your plan</h3>
              <PlanRows plan={summary.planned} summary={summary} currency={currency} />
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-6">
              <h3 className="mb-2 font-black">No plan saved</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Fill in the form to create a plan for this month.</p>
            </div>
          )}

          <div className="glass-card rounded-3xl p-6">
            <h3 className="mb-4 font-black">Planned vs actual</h3>
            <div className="space-y-3 text-sm">
              <CompareRow label="Income" planned={summary?.planned?.expectedIncome ?? 0} actual={summary?.actual.income ?? 0} currency={currency} />
              <CompareRow label="Expenses" planned={summary?.planned?.plannedExpenses ?? 0} actual={summary?.actual.expenses ?? 0} currency={currency} />
              <CompareRow label="Net" planned={summary?.planned?.remaining ?? 0} actual={summary?.actual.net ?? 0} currency={currency} />
              <div className="flex items-center justify-between border-t border-slate-200/70 pt-3 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">Debt paid</span>
                <span className="font-black text-rose-600 dark:text-rose-400">{formatMoney(summary?.actual.debtPaid ?? 0, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Debt received</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">{formatMoney(summary?.actual.debtReceived ?? 0, currency)}</span>
              </div>
            </div>
          </div>

          {plans.length > 0 ? (
            <div className="glass-card rounded-3xl p-6">
              <h3 className="mb-3 font-black">Saved months</h3>
              <div className="flex flex-wrap gap-2">
                {plans.map((item) => (
                  <button
                    key={`${item.year}-${item.month}`}
                    onClick={() => {
                      setYear(item.year);
                      setMonth(item.month);
                      selectPlan(item);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      item.year === year && item.month === month
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 bg-white/70 text-slate-700 hover:border-blue-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                    }`}
                  >
                    {monthNames[item.month - 1]} {item.year}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SelectMonth({ year, setYear }: { year: number; setYear: (value: number) => void }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, index) => currentYear - 2 + index);
  return (
    <select
      value={year}
      onChange={(event) => setYear(Number(event.target.value))}
      className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold shadow-sm outline-none dark:border-white/10 dark:bg-white/[0.04]"
    >
      {years.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}

function SelectMonthNumber({ month, setMonth }: { month: number; setMonth: (value: number) => void }) {
  return (
    <select
      value={month}
      onChange={(event) => setMonth(Number(event.target.value))}
      className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold shadow-sm outline-none dark:border-white/10 dark:bg-white/[0.04]"
    >
      {monthNames.map((name, index) => (
        <option key={name} value={index + 1}>
          {name}
        </option>
      ))}
    </select>
  );
}

function PlanRows({ plan, summary, currency }: { plan: NonNullable<Summary["planned"]>; summary: Summary; currency: string }) {
  const rows = [
    { label: "Expected income", value: plan.expectedIncome, tone: "text-emerald-600 dark:text-emerald-400" },
    { label: "Planned expenses", value: plan.plannedExpenses, tone: "text-rose-600 dark:text-rose-400" },
    { label: "Subscriptions", value: plan.plannedSubscriptions, tone: "text-amber-600 dark:text-amber-300" },
    { label: "Debt payments", value: plan.plannedDebtPayments, tone: "text-rose-600 dark:text-rose-400" },
    { label: "Savings goal", value: plan.savingsGoal, tone: "text-emerald-600 dark:text-emerald-400" },
    { label: "Flexible remaining", value: plan.remaining, tone: plan.remaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400" },
  ];
  return (
    <div className="space-y-3 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
          <span className={`font-black ${row.tone}`}>{formatMoney(row.value, currency)}</span>
        </div>
      ))}
    </div>
  );
}

function CompareRow({ label, planned, actual, currency }: { label: string; planned: number; actual: number; currency: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-slate-400">
          planned {formatMoney(planned, currency)} • actual {formatMoney(actual, currency)}
        </p>
      </div>
      <span className={`text-xs font-bold ${actual >= planned ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-300"}`}>
        {((planned ? ((actual - planned) / planned) * 100 : 0)).toFixed(0)}%
      </span>
    </div>
  );
}