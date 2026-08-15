"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { TransactionForm, type TransactionFormData } from "../../../components/transaction-form";
import { ConfirmButton } from "../../../components/confirm-button";
import { api, jsonPatch, jsonPost } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

type Expense = {
  id: string;
  amount: number | string;
  currency: string;
  convertedAmount: number | string;
  category: string;
  date: string;
  frequency: string;
  isRecurring: boolean;
  paymentMethod: string | null;
  notes: string | null;
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const currency = profile?.mainCurrency ?? "USD";
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => api<{ expenses: Expense[] }>("/expenses"),
  });

  const addMutation = useMutation({
    mutationFn: (input: TransactionFormData) => api("/expenses", jsonPost(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setAdding(false);
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: TransactionFormData }) =>
      api(`/expenses/${id}`, jsonPatch(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/expenses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const expenses = data?.expenses ?? [];
  const total = expenses.reduce((sum, expense) => sum + Number(expense.convertedAmount), 0);

  return (
    <div className="space-y-5">
      <div className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Expenses</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Daily, one-time, and recurring expenses across every category.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total recorded</p>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400">{formatMoney(total, currency)}</p>
        </div>
      </div>

      {!adding && !editing ? (
        <div className="flex gap-3">
          <button
            onClick={() => setAdding(true)}
            className="rounded-full bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-500"
          >
            Add expense
          </button>
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-200 bg-white/70 px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            Back to dashboard
          </Link>
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-black">{editing ? "Edit expense" : "Record expense"}</h2>
            <button
              onClick={() => {
                setAdding(false);
                setEditing(null);
              }}
              className="rounded-full bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-600 dark:text-rose-300"
            >
              Cancel
            </button>
          </div>
          <TransactionForm
            type="expense"
            key={editing ? editing.id : "new"}
            submitLabel={editing ? "Save changes" : "Save expense"}
            submitting={(editing ? editMutation : addMutation).isPending}
            initialValue={
              editing
                ? {
                    amount: Number(editing.amount),
                    currency: editing.currency,
                    category: editing.category,
                    date: editing.date.slice(0, 10),
                    frequency: editing.frequency,
                    isRecurring: editing.isRecurring,
                    paymentMethod: editing.paymentMethod ?? undefined,
                    notes: editing.notes ?? "",
                  }
                : undefined
            }
            onSubmit={(input) =>
              editing
                ? editMutation.mutateAsync({ id: editing.id, input })
                : addMutation.mutateAsync(input)
            }
          />
        </div>
      )}

      <div className="glass-card rounded-3xl p-5">
        <h2 className="mb-4 font-black">History</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-2xl bg-white/50 dark:bg-white/[0.03]" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
            No expenses recorded yet. Add your first expense above.
          </p>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="group flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3 dark:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-lg">↓</span>
                  <div>
                    <p className="font-bold">{expense.category}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {expense.paymentMethod ? `${expense.paymentMethod} • ` : ""}
                      {formatDate(expense.date)} {expense.frequency !== "ONCE" ? `• ${expense.frequency.toLowerCase()}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-black text-rose-600 dark:text-rose-400">
                    -{formatMoney(Number(expense.convertedAmount), currency)}
                  </p>
                  {expense.currency !== currency ? (
                    <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-bold text-blue-600 dark:text-blue-300">
                      {expense.currency}
                    </span>
                  ) : null}
                  <button
                    onClick={() => setEditing(expense)}
                    title="Edit"
                    className="rounded-full bg-blue-500/10 px-3 py-1.5 text-sm font-bold text-blue-600 opacity-0 transition group-hover:opacity-100 dark:bg-blue-500/10 dark:text-blue-300"
                  >
                    Edit
                  </button>
                  <ConfirmButton
                    onConfirm={() => deleteMutation.mutate(expense.id)}
                    busy={deleteMutation.isPending}
                    className="rounded-full bg-rose-500/10 px-3 py-1.5 text-sm font-bold text-rose-600 opacity-0 transition group-hover:opacity-100 dark:bg-rose-500/10 dark:text-rose-300"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}