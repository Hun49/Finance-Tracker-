"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Field, PrimaryButton, SelectInput, TextInput } from "../../../components/ui";
import { ConfirmButton } from "../../../components/confirm-button";
import { supportedCurrencies } from "../../../lib/currencies";
import { api, jsonPatch, jsonPost } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

type Subscription = {
  id: string;
  name: string;
  amount: number | string;
  currency: string;
  convertedAmount: number | string;
  billingCycle: string;
  nextPaymentDate: string;
  category: string;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  notes: string | null;
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

const statusTone: Record<Subscription["status"], string> = {
  ACTIVE: "bg-emerald-500",
  PAUSED: "bg-amber-400",
  CANCELLED: "bg-rose-500",
};

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const currency = profile?.mainCurrency ?? "USD";
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [subCurrency, setSubCurrency] = useState(currency);
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [nextPaymentDate, setNextPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("Subscriptions");
  const [status, setStatus] = useState<Subscription["status"]>("ACTIVE");

  const { data, isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => api<{ subscriptions: Subscription[] }>("/subscriptions"),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      api(
        "/subscriptions",
        jsonPost({
          name,
          amount: Number(amount),
          currency: subCurrency,
          billingCycle,
          nextPaymentDate,
          category,
          status,
        }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setAdding(false);
      setName("");
      setAmount("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/subscriptions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const editMutation = useMutation({
    mutationFn: () =>
      editing
        ? api(
            `/subscriptions/${editing.id}`,
            jsonPatch({
              name,
              amount: Number(amount),
              currency: subCurrency,
              billingCycle,
              nextPaymentDate,
              category,
              status,
            }),
          )
        : Promise.reject(new Error("No subscription selected")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setEditing(null);
      setAdding(false);
      setName("");
      setAmount("");
    },
  });

  function startEdit(subscription: Subscription) {
    setEditing(subscription);
    setName(subscription.name);
    setAmount(String(subscription.amount));
    setSubCurrency(subscription.currency);
    setBillingCycle(subscription.billingCycle);
    setNextPaymentDate(subscription.nextPaymentDate.slice(0, 10));
    setCategory(subscription.category);
    setStatus(subscription.status);
    setAdding(true);
  }

  const toggleMutation = useMutation({
    mutationFn: ({ id, status: next }: { id: string; status: Subscription["status"] }) =>
      api(`/subscriptions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  const subscriptions = data?.subscriptions ?? [];
  const monthlyTotal = subscriptions
    .filter((subscription) => subscription.status === "ACTIVE")
    .reduce((sum, subscription) => sum + monthlyOf(subscription), 0);

  return (
    <div className="space-y-5">
      <div className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Subscriptions</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Recurring payments like streaming, apps, gym, and bills.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 dark:text-slate-400">Active monthly total</p>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-300">{formatMoney(monthlyTotal, currency)}</p>
        </div>
      </div>

      {!adding ? (
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditing(null);
              setAdding(true);
            }}
            className="rounded-full bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-400"
          >
            Add subscription
          </button>
          <Link href="/dashboard" className="rounded-full border border-slate-200 bg-white/70 px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            Back to dashboard
          </Link>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (editing) editMutation.mutate();
            else addMutation.mutate();
          }}
          className="glass-card space-y-5 rounded-3xl p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-black">{editing ? "Edit subscription" : "Add subscription"}</h2>
            <button
              onClick={() => {
                setEditing(null);
                setAdding(false);
              }}
              className="rounded-full bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-600 dark:text-rose-300"
            >
              Cancel
            </button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name">
              <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Netflix" required />
            </Field>
            <Field label="Category">
              <TextInput value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Subscriptions" required />
            </Field>
            <Field label="Amount">
              <TextInput type="number" step="0.01" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required />
            </Field>
            <Field label="Currency">
              <SelectInput value={subCurrency} onChange={(event) => setSubCurrency(event.target.value)}>
                {supportedCurrencies.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Billing cycle">
              <SelectInput value={billingCycle} onChange={(event) => setBillingCycle(event.target.value)}>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </SelectInput>
            </Field>
            <Field label="Next payment date">
              <TextInput type="date" value={nextPaymentDate} onChange={(event) => setNextPaymentDate(event.target.value)} required />
            </Field>
            <Field label="Status">
              <SelectInput value={status} onChange={(event) => setStatus(event.target.value as Subscription["status"])}>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="CANCELLED">Cancelled</option>
              </SelectInput>
            </Field>
          </div>
          <PrimaryButton type="submit" disabled={(editing ? editMutation : addMutation).isPending}>
            {(editing ? editMutation : addMutation).isPending ? "Saving…" : editing ? "Save changes" : "Save subscription"}
          </PrimaryButton>
        </form>
      )}

      <div className="glass-card rounded-3xl p-5">
        <h2 className="mb-4 font-black">Your subscriptions</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-2xl bg-white/50 dark:bg-white/[0.03]" />
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
            No subscriptions yet. Add one above.
          </p>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/60 px-4 py-3 dark:bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusTone[subscription.status]}`} />
                  <div>
                    <p className="font-bold">{subscription.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {subscription.category} • {formatMoney(Number(subscription.convertedAmount), currency)} • {subscription.billingCycle.toLowerCase()}
                      {subscription.status !== "ACTIVE" ? ` • ${subscription.status.toLowerCase()}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                    next: {new Date(subscription.nextPaymentDate).toLocaleDateString()}
                  </span>
                  {subscription.status === "ACTIVE" ? (
                    <button
                      onClick={() => toggleMutation.mutate({ id: subscription.id, status: "PAUSED" })}
                      className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-300"
                    >
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleMutation.mutate({ id: subscription.id, status: "ACTIVE" })}
                      className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-300"
                    >
                      Reactivate
                    </button>
                  )}
                  <button onClick={() => startEdit(subscription)} className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-300">
                    Edit
                  </button>
                  <ConfirmButton
                    onConfirm={() => deleteMutation.mutate(subscription.id)}
                    busy={deleteMutation.isPending}
                    title="Delete subscription"
                    className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-300"
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

function monthlyOf(subscription: Subscription): number {
  const amount = Number(subscription.convertedAmount);
  switch (subscription.billingCycle) {
    case "DAILY":
      return amount * 30;
    case "WEEKLY":
      return amount * 4.33;
    case "YEARLY":
      return amount / 12;
    default:
      return amount;
  }
}