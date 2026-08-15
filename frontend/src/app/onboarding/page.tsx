"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, PrimaryButton, SelectInput, TextInput } from "../../components/ui";
import type { OnboardingInput } from "../../lib/auth";
import { useAuth } from "../../lib/auth";

const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "AED", "ETB", "JPY", "CHF", "CNY"];

const incomeFrequencyOptions: Array<{ value: OnboardingInput["incomeFrequency"]; label: string; hint: string }> = [
  { value: "DAILY", label: "Daily", hint: "Paid every day" },
  { value: "WEEKLY", label: "Weekly", hint: "Paid every week" },
  { value: "MONTHLY", label: "Monthly", hint: "Salary each month" },
  { value: "IRREGULAR", label: "Irregular", hint: "No fixed schedule" },
  { value: "CUSTOM", label: "Custom", hint: "Your own schedule" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const [mainCurrency, setMainCurrency] = useState("USD");
  const [startingBalance, setStartingBalance] = useState("");
  const [incomeFrequency, setIncomeFrequency] = useState<OnboardingInput["incomeFrequency"]>("MONTHLY");
  const [expectedIncomeAmount, setExpectedIncomeAmount] = useState("");
  const [salaryDay, setSalaryDay] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const data: OnboardingInput = {
      mainCurrency,
      startingBalance: Number(startingBalance) || 0,
      incomeFrequency,
      expectedIncomeAmount: expectedIncomeAmount ? Number(expectedIncomeAmount) : null,
      salaryDay: salaryDay === "" ? null : Number(salaryDay),
    };

    try {
      await completeOnboarding(data);
      router.push("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-950 transition-colors dark:bg-black dark:text-white">
      <div className="absolute left-[-10rem] top-[-8rem] h-80 w-80 rounded-full bg-blue-300/40 blur-3xl dark:bg-blue-500/15" />
      <div className="absolute bottom-[-8rem] right-[-8rem] h-80 w-80 rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-500/15" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-5 py-10">
        <div className="glass-card w-full rounded-[2rem] p-7 sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-black text-white">
              ✓
            </div>
            <h1 className="text-3xl font-black tracking-tight">Set up your tracker</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Choose your main currency and starting balance. You can add income daily even if you just picked a
              salary frequency.
            </p>
          </div>

          {error ? (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Main currency">
                <SelectInput value={mainCurrency} onChange={(event) => setMainCurrency(event.target.value)}>
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Starting bank balance" hint="What you have in the bank right now.">
                <TextInput
                  type="number"
                  step="0.01"
                  min="0"
                  value={startingBalance}
                  onChange={(event) => setStartingBalance(event.target.value)}
                  placeholder="0.00"
                  required
                />
              </Field>
            </div>

            <Field label="How are you usually paid?">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {incomeFrequencyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setIncomeFrequency(option.value)}
                    className={`rounded-2xl border px-3 py-3 text-center transition ${
                      incomeFrequency === option.value
                        ? "border-blue-500 bg-blue-500/10 shadow-sm"
                        : "border-slate-200 bg-white/60 hover:border-blue-300 dark:border-white/10 dark:bg-white/[0.03]"
                    }`}
                  >
                    <span className="block text-sm font-bold">{option.label}</span>
                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{option.hint}</span>
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Expected income amount">
                <TextInput
                  type="number"
                  step="0.01"
                  min="0"
                  value={expectedIncomeAmount}
                  onChange={(event) => setExpectedIncomeAmount(event.target.value)}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Salary / payment day" hint="Day of the month, 1 to 31. Optional.">
                <TextInput
                  type="number"
                  min="1"
                  max="31"
                  value={salaryDay}
                  onChange={(event) => setSalaryDay(event.target.value ? Number(event.target.value) : "")}
                  placeholder="e.g. 25"
                />
              </Field>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              Your balance and reports are calculated only from what you enter manually. This app never connects to a
              real bank.
            </div>

            <PrimaryButton type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving setup…" : "Finish setup"}
            </PrimaryButton>
          </form>
        </div>
      </div>
    </main>
  );
}