"use client";

import { useState } from "react";
import { expenseCategories, frequencies, incomeCategories, supportedCurrencies } from "../lib/currencies";
import { useAuth } from "../lib/auth";
import { Field, PrimaryButton, SelectInput, Textarea, TextInput } from "./ui";

export type TransactionFormData = {
  amount: number;
  currency: string;
  category: string;
  date: string;
  frequency: string;
  isRecurring: boolean;
  notes: string;
  source?: string;
  paymentMethod?: string;
};

type Props = {
  type: "income" | "expense";
  initialValue?: TransactionFormData;
  onSubmit: (data: TransactionFormData) => Promise<unknown>;
  submitting?: boolean;
  submitLabel?: string;
};

export function TransactionForm({ type, initialValue, onSubmit, submitting = false, submitLabel }: Props) {
  const { profile } = useAuth();
  const mainCurrency = profile?.mainCurrency ?? "USD";
  const categories = type === "income" ? incomeCategories : expenseCategories;

  const [amount, setAmount] = useState(initialValue ? String(initialValue.amount) : "");
  const [currency, setCurrency] = useState(initialValue?.currency ?? mainCurrency);
  const [category, setCategory] = useState(initialValue?.category ?? categories[0]);
  const [date, setDate] = useState(initialValue?.date ?? new Date().toISOString().slice(0, 10));
  const [frequency, setFrequency] = useState(initialValue?.frequency ?? "ONCE");
  const [isRecurring, setIsRecurring] = useState(initialValue?.isRecurring ?? false);
  const [name, setName] = useState(initialValue?.source ?? initialValue?.paymentMethod ?? "");
  const [notes, setNotes] = useState(initialValue?.notes ?? "");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void onSubmit({
      amount: Number(amount),
      currency,
      category,
      date,
      frequency,
      isRecurring,
      notes,
      ...(type === "income" ? { source: name } : { paymentMethod: name }),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Amount">
          <TextInput type="number" step="0.01" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required />
        </Field>
        <Field label="Currency">
          <SelectInput value={currency} onChange={(event) => setCurrency(event.target.value)}>
            {supportedCurrencies.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <p className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
        {currency === mainCurrency
          ? `Stored in your main currency (${mainCurrency}).`
          : `Converted automatically to your main currency (${mainCurrency}).`}
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={type === "income" ? "Source" : "Payment method"}>
          <TextInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={type === "income" ? "e.g. Side job" : "e.g. Debit card"}
            required
          />
        </Field>
        <Field label="Category">
          <SelectInput value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Date">
          <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </Field>
        <Field label="Frequency">
          <SelectInput value={frequency} onChange={(event) => setFrequency(event.target.value)}>
            {frequencies.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={(event) => setIsRecurring(event.target.checked)}
          className="h-5 w-5 rounded border-slate-300 accent-blue-600"
        />
        Recurring transaction
      </label>

      <Field label="Notes" hint="Optional">
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="Add details…" />
      </Field>

      <PrimaryButton type="submit" disabled={submitting}>
        {submitLabel ?? `Add ${type}`}
      </PrimaryButton>
    </form>
  );
}