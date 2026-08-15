"use client";

import { useState } from "react";
import { Field, PrimaryButton, SelectInput, TextInput } from "../../../components/ui";
import type { OnboardingInput } from "../../../lib/auth";
import { useAuth } from "../../../lib/auth";

const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "AED", "ETB", "JPY", "CHF", "CNY"];

export default function SettingsPage() {
  const { user, profile, completeOnboarding } = useAuth();
  const profileInput: OnboardingInput | null = profile
    ? {
        mainCurrency: profile.mainCurrency,
        startingBalance: Number(profile.startingBalance),
        incomeFrequency: profile.incomeFrequency as OnboardingInput["incomeFrequency"],
        expectedIncomeAmount: profile.expectedIncomeAmount ? Number(profile.expectedIncomeAmount) : null,
        salaryDay: profile.salaryDay,
      }
    : null;

  return (
    <div className="space-y-5">
      <div className="glass-card rounded-3xl p-8">
        <h1 className="text-2xl font-black tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Your account and tracker setup.</p>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <h2 className="mb-4 font-black">Profile summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-3 dark:bg-white/[0.03]">
            <span className="text-slate-500 dark:text-slate-400">Name</span>
            <span className="font-bold">{user?.name}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-3 dark:bg-white/[0.03]">
            <span className="text-slate-500 dark:text-slate-400">Email</span>
            <span className="font-bold">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-3 dark:bg-white/[0.03]">
            <span className="text-slate-500 dark:text-slate-400">Main currency</span>
            <span className="font-bold">{profile?.mainCurrency ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-3 dark:bg-white/[0.03]">
            <span className="text-slate-500 dark:text-slate-400">Starting balance</span>
            <span className="font-bold">{profile ? Number(profile.startingBalance).toLocaleString() : "—"}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-3 dark:bg-white/[0.03]">
            <span className="text-slate-500 dark:text-slate-400">Income frequency</span>
            <span className="font-bold capitalize">{profile ? profile.incomeFrequency.toLowerCase() : "—"}</span>
          </div>
        </div>
      </div>

      {profileInput ? <UpdateSetupForm initial={profileInput} onSave={completeOnboarding} /> : null}
    </div>
  );
}

function UpdateSetupForm({
  initial,
  onSave,
}: {
  initial: OnboardingInput;
  onSave: (data: OnboardingInput) => Promise<void>;
}) {
  const [mainCurrency, setMainCurrency] = useState(initial.mainCurrency);
  const [startingBalance, setStartingBalance] = useState(String(initial.startingBalance));
  const [incomeFrequency, setIncomeFrequency] = useState<OnboardingInput["incomeFrequency"]>(initial.incomeFrequency);
  const [expectedIncomeAmount, setExpectedIncomeAmount] = useState(initial.expectedIncomeAmount ? String(initial.expectedIncomeAmount) : "");
  const [salaryDay, setSalaryDay] = useState<number | "">(initial.salaryDay ?? "");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await onSave({
      mainCurrency,
      startingBalance: Number(startingBalance) || 0,
      incomeFrequency,
      expectedIncomeAmount: expectedIncomeAmount ? Number(expectedIncomeAmount) : null,
      salaryDay: salaryDay === "" ? null : Number(salaryDay),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-5 rounded-3xl p-6">
      <h2 className="font-black">Update your setup</h2>
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
        <Field label="Starting balance">
          <TextInput type="number" step="0.01" min="0" value={startingBalance} onChange={(event) => setStartingBalance(event.target.value)} />
        </Field>
        <Field label="Income frequency">
          <SelectInput value={incomeFrequency} onChange={(event) => setIncomeFrequency(event.target.value as OnboardingInput["incomeFrequency"])}>
            {["DAILY", "WEEKLY", "MONTHLY", "IRREGULAR", "CUSTOM"].map((value) => (
              <option key={value} value={value}>
                {value.toLowerCase()}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Expected income amount">
          <TextInput type="number" step="0.01" min="0" value={expectedIncomeAmount} onChange={(event) => setExpectedIncomeAmount(event.target.value)} />
        </Field>
        <Field label="Salary / payment day">
          <TextInput type="number" min="1" max="31" value={salaryDay} onChange={(event) => setSalaryDay(event.target.value ? Number(event.target.value) : "")} />
        </Field>
      </div>
      <div className="flex items-center gap-4">
        <PrimaryButton type="submit">Save changes</PrimaryButton>
        {saved ? <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Saved ✓</span> : null}
      </div>
    </form>
  );
}