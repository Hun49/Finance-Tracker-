"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Field, PrimaryButton, SelectInput, TextInput } from "../../../components/ui";
import { ConfirmButton } from "../../../components/confirm-button";
import { supportedCurrencies } from "../../../lib/currencies";
import { api, jsonPatch, jsonPost } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

type Debt = {
  id: string;
  personName: string;
  type: "THEY_OWE_ME" | "I_OWE_THEM";
  currency: string;
  originalAmount: number | string;
  convertedOriginalAmount: number | string;
  paidAmount: number | string;
  remainingAmount: number | string;
  deadline: string | null;
  paymentPlan: string | null;
  status: "ACTIVE" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
  notes: string | null;
  payments: Payment[];
};

type Payment = {
  id: string;
  convertedAmount: number | string;
  paymentDate: string;
  direction: "PAID_BY_ME" | "PAID_TO_ME";
  notes: string | null;
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

const typeLabel: Record<Debt["type"], string> = {
  THEY_OWE_ME: "They owe me",
  I_OWE_THEM: "I owe them",
};

const typeTone: Record<Debt["type"], string> = {
  THEY_OWE_ME: "text-emerald-600 dark:text-emerald-400",
  I_OWE_THEM: "text-rose-600 dark:text-rose-400",
};

const statusTone: Record<Debt["status"], string> = {
  ACTIVE: "bg-blue-500",
  PARTIALLY_PAID: "bg-amber-400",
  PAID: "bg-emerald-500",
  OVERDUE: "bg-rose-500",
  CANCELLED: "bg-slate-400",
};

export default function DebtsPage() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const currency = profile?.mainCurrency ?? "USD";

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [type, setType] = useState<Debt["type"]>("THEY_OWE_ME");
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [debtCurrency, setDebtCurrency] = useState(currency);
  const [deadline, setDeadline] = useState("");
  const [paymentPlan, setPaymentPlan] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["debts"],
    queryFn: () => api<{ debts: Debt[] }>("/debts"),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      api(
        "/debts",
        jsonPost({
          personName,
          type,
          originalAmount: Number(amount),
          currency: debtCurrency,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          paymentPlan: paymentPlan || null,
        }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setAdding(false);
      setPersonName("");
      setAmount("");
      setPaymentPlan("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/debts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const editMutation = useMutation({
    mutationFn: () =>
      editing
        ? api(
            `/debts/${editing.id}`,
            jsonPatch({
              personName,
              type,
              originalAmount: Number(amount),
              currency: debtCurrency,
              deadline: deadline ? new Date(deadline).toISOString() : null,
              paymentPlan: paymentPlan || null,
            }),
          )
        : Promise.reject(new Error("No debt selected")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setEditing(null);
      setAdding(false);
      setPersonName("");
      setAmount("");
      setPaymentPlan("");
    },
  });

  function startEdit(debt: Debt) {
    setEditing(debt);
    setType(debt.type);
    setPersonName(debt.personName);
    setAmount(String(debt.originalAmount));
    setDebtCurrency(debt.currency);
    setDeadline(debt.deadline ? debt.deadline.slice(0, 10) : "");
    setPaymentPlan(debt.paymentPlan ?? "");
    setAdding(true);
  }

  const debts = data?.debts ?? [];
  const theyOweMe = debts.filter((debt) => debt.type === "THEY_OWE_ME" && debt.status !== "PAID" && debt.status !== "CANCELLED");
  const iOwe = debts.filter((debt) => debt.type === "I_OWE_THEM" && debt.status !== "PAID" && debt.status !== "CANCELLED");

  const totalOwed = debts.reduce((sum, debt) => sum + overdueRemaining(debt, "THEY_OWE_ME"), 0);
  const totalIOwe = debts.reduce((sum, debt) => sum + overdueRemaining(debt, "I_OWE_THEM"), 0);

  return (
    <div className="space-y-5">
      <div className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Debt keeper</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Who owes you, who you owe, deadlines, and payments.</p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">Owed to you</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatMoney(totalOwed, currency)}</p>
          </div>
          <div>
            <p className="text-sm text-rose-600 dark:text-rose-400">You owe</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{formatMoney(totalIOwe, currency)}</p>
          </div>
        </div>
      </div>

      {!adding ? (
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditing(null);
              setAdding(true);
            }}
            className="rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
          >
            Track a debt
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
            <h2 className="font-black">{editing ? "Edit debt" : "Track a debt"}</h2>
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
          <div className="grid grid-cols-2 gap-3">
            {(["THEY_OWE_ME", "I_OWE_THEM"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                  type === option
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-200 bg-white/60 hover:border-blue-300 dark:border-white/10 dark:bg-white/[0.03]"
                }`}
              >
                {typeLabel[option]}
              </button>
            ))}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Person name">
              <TextInput value={personName} onChange={(event) => setPersonName(event.target.value)} placeholder="e.g. Marcus" required />
            </Field>
            <Field label="Amount">
              <TextInput type="number" step="0.01" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required />
            </Field>
            <Field label="Currency">
              <SelectInput value={debtCurrency} onChange={(event) => setDebtCurrency(event.target.value)}>
                {supportedCurrencies.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Deadline">
              <TextInput type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
            </Field>
            <Field label="Payment plan" hint="e.g. $100 weekly until paid">
              <TextInput value={paymentPlan} onChange={(event) => setPaymentPlan(event.target.value)} placeholder="Optional" />
            </Field>
          </div>
          <PrimaryButton type="submit" disabled={(editing ? editMutation : addMutation).isPending}>
            {(editing ? editMutation : addMutation).isPending ? "Saving…" : editing ? "Save changes" : "Save debt"}
          </PrimaryButton>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-14 animate-pulse rounded-2xl bg-white/50 dark:bg-white/[0.03]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <DebtGroup
            title="They owe you"
            tone="emerald"
            debts={theyOweMe}
            currency={currency}
            onEdit={startEdit}
            renderPaymentLabel={(debt) => debt.payments.length > 0 && (
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                {debt.payments.length} payment{debt.payments.length === 1 ? "" : "s"} received
              </p>
            )}
          />
          <DebtGroup
            title="You owe"
            tone="rose"
            debts={iOwe}
            currency={currency}
            onEdit={startEdit}
            renderPaymentLabel={(debt) => debt.payments.length > 0 && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                {debt.payments.length} payment{debt.payments.length === 1 ? "" : "s"} made
              </p>
            )}
          />
        </div>
      )}
    </div>
  );
}

function overdueRemaining(debt: Debt, type: Debt["type"]) {
  if (debt.type !== type || debt.status === "PAID" || debt.status === "CANCELLED") return 0;
  return Number(debt.remainingAmount);
}

function DebtGroup({
  title,
  tone,
  debts,
  currency,
  renderPaymentLabel,
  onEdit,
}: {
  title: string;
  tone: "emerald" | "rose";
  debts: Debt[];
  currency: string;
  renderPaymentLabel: (debt: Debt) => React.ReactNode;
  onEdit: (debt: Debt) => void;
}) {
  const queryClient = useQueryClient();

  return (
    <div className="glass-card rounded-3xl p-5">
      <h2 className={`mb-4 font-black ${tone === "emerald" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{title}</h2>
      {debts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
          Nothing here.
        </p>
      ) : (
        <div className="space-y-3">
          {debts.map((debt) => (
            <div key={debt.id} className="rounded-2xl bg-white/60 p-4 dark:bg-white/[0.03]">
              <DebtRow debt={debt} currency={currency} tone={tone} renderPaymentLabel={renderPaymentLabel} onEdit={onEdit} />
              <PaymentHistory debt={debt} currency={currency} tone={tone} queryClient={queryClient} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DebtRow({
  debt,
  currency,
  tone,
  renderPaymentLabel,
  onEdit,
}: {
  debt: Debt;
  currency: string;
  tone: "emerald" | "rose";
  renderPaymentLabel: (debt: Debt) => React.ReactNode;
  onEdit: (debt: Debt) => void;
}) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/debts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-bold">{debt.personName}</p>
          <span className={`h-2 w-2 rounded-full ${statusTone[debt.status]}`} />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {debt.deadline ? `Due ${new Date(debt.deadline).toLocaleDateString()} • ` : ""}
          remaining <span className={`font-bold ${tone === "emerald" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{formatMoney(Number(debt.remainingAmount), currency)}</span>
        </p>
        {renderPaymentLabel(debt)}
        {debt.paymentPlan ? <p className="mt-1 text-xs text-slate-400">{debt.paymentPlan}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onEdit(debt)} title="Edit" className="rounded-full bg-blue-500/10 px-3 py-1.5 text-sm font-bold text-blue-600 dark:text-blue-300">
          Edit
        </button>
        <ConfirmButton
          onConfirm={() => deleteMutation.mutate(debt.id)}
          busy={deleteMutation.isPending}
          title="Delete debt"
          className="rounded-full bg-rose-500/10 px-3 py-1.5 text-sm font-bold text-rose-600 dark:text-rose-300"
        />
      </div>
    </div>
  );
}

function PaymentHistory({
  debt,
  currency,
  tone,
  queryClient,
}: {
  debt: Debt;
  currency: string;
  tone: "emerald" | "rose";
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));

  const paymentMutation = useMutation({
    mutationFn: () =>
      api(
        `/debts/${debt.id}/payments`,
        jsonPost({
          amount: Number(amount),
          currency,
          paymentDate: new Date(paymentDate).toISOString(),
        }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setAmount("");
      setOpen(false);
    },
  });

  return (
    <div className="mt-3 border-t border-slate-200/70 pt-3 dark:border-white/10">
      <div className="flex items-center justify-between">
        <button onClick={() => setOpen((value) => !value)} className="text-xs font-bold text-blue-600 dark:text-blue-300">
          {open ? "Close payments" : `Record payment (${debt.payments.length})`}
        </button>
      </div>

      {open ? (
        <div className="mt-3 space-y-3">
          {debt.payments.length > 0 ? (
            <ul className="space-y-1.5">
              {debt.payments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </span>
                  <span className={`font-bold ${tone === "emerald" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {payment.direction === "PAID_TO_ME" ? "+" : "-"}
                    {formatMoney(Number(payment.convertedAmount), currency)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No payments recorded yet.</p>
          )}

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <TextInput type="number" step="0.01" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" />
            <TextInput type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
            <PrimaryButton
              type="button"
              className="!px-4 !py-2"
              disabled={!amount || paymentMutation.isPending}
              onClick={() => paymentMutation.mutate()}
            >
              {paymentMutation.isPending ? "…" : "Add"}
            </PrimaryButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}