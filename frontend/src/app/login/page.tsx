"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, PrimaryButton, TextInput } from "../../components/ui";
import { useAuth } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed");
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-950 transition-colors dark:bg-black dark:text-white">
      <div className="absolute left-[-10rem] top-[-8rem] h-80 w-80 rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-500/15" />
      <div className="absolute bottom-[-8rem] right-[-8rem] h-80 w-80 rounded-full bg-blue-300/40 blur-3xl dark:bg-blue-500/15" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-5 py-10">
        <div className="glass-card w-full rounded-[2rem] p-7 sm:p-9">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-xl font-black text-white dark:bg-white dark:text-black">
              F
            </div>
            <h1 className="text-3xl font-black tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Log in to your Finance Tracker account.</p>
          </div>

          {error ? (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Email">
              <TextInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoComplete="email" />
            </Field>
            <Field label="Password">
              <TextInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required autoComplete="current-password" />
            </Field>
            <PrimaryButton type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Logging in…" : "Log in"}
            </PrimaryButton>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            New to Finance Tracker?{" "}
            <Link href="/register" className="font-bold text-blue-600 hover:text-blue-500 dark:text-blue-300">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}