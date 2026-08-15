"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Field, PrimaryButton, TextInput } from "../../components/ui";
import { useAuth } from "../../lib/auth";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const { verifyEmail } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await verifyEmail(email, code.trim());
      router.push("/onboarding");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Verification failed");
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-950 transition-colors dark:bg-black dark:text-white">
      <div className="absolute left-[-10rem] top-[-8rem] h-80 w-80 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-400/10" />
      <div className="absolute bottom-[-8rem] right-[-8rem] h-80 w-80 rounded-full bg-blue-300/40 blur-3xl dark:bg-blue-500/15" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-5 py-10">
        <div className="glass-card w-full rounded-[2rem] p-7 sm:p-9">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white">
              ✓
            </div>
            <h1 className="text-3xl font-black tracking-tight">Check your email</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Enter the 6-digit code sent to{" "}
              <span className="font-bold text-slate-700 dark:text-slate-200">{email || "your email"}</span>.
            </p>
          </div>

          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
            No email received? In development the code is printed in the terminal running the app — look for{" "}
            <code className="rounded bg-amber-500/10 px-1.5 py-0.5 font-mono">[dev-email] Verification code</code>.
          </div>

          {error ? (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Verification code" hint="Codes expire after 10 minutes.">
              <TextInput
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                pattern="\d{6}"
                className="text-center text-2xl font-black tracking-[0.6em]"
                required
                maxLength={6}
              />
            </Field>
            <PrimaryButton type="submit" className="w-full" disabled={submitting || code.length !== 6}>
              {submitting ? "Verifying…" : "Verify account"}
            </PrimaryButton>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            <Link href="/register" className="font-bold text-blue-600 hover:text-blue-500 dark:text-blue-300">
              Use a different email
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}