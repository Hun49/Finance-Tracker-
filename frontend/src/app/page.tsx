"use client";

import Link from "next/link";
import { ThemeToggle } from "../components/theme";
import { useAuth } from "../lib/auth";

const modules = [
  {
    title: "Income",
    color: "bg-emerald-500",
    text: "Daily, weekly, or monthly salary plus one-off income any day. Foreign currency converts to your main currency automatically.",
  },
  {
    title: "Expenses",
    color: "bg-rose-500",
    text: "Log one-time, daily, and recurring expenses across categories like food, rent, transport, and bills.",
  },
  {
    title: "Subscriptions",
    color: "bg-amber-400",
    text: "Track Netflix, gym, and phone bills with billing cycles, next payment dates, and pause/reactivate controls.",
  },
  {
    title: "Debt keeper",
    color: "bg-blue-500",
    text: "Who owes you money and who you owe. Record payments, deadlines, and remaining balances automatically.",
  },
  {
    title: "Monthly planner",
    color: "bg-violet-500",
    text: "Plan income, expenses, debt payments, and savings goals, then compare planned vs actual each month.",
  },
  {
    title: "Reports",
    color: "bg-cyan-500",
    text: "Daily, weekly, monthly, yearly, and custom totals for income, expenses, categories, and net result.",
  },
];

const steps = [
  { number: "1", title: "Create an account", text: "Register with your email and verify with a 6-digit code." },
  { number: "2", title: "Set up your finance", text: "Choose your main currency, starting balance, and income frequency." },
  { number: "3", title: "Track and report", text: "Log income and expenses daily. Get summaries, plans, and insight." },
];

const colors = [
  { label: "Green", text: "Income, savings, positive balances", color: "bg-emerald-500" },
  { label: "Red", text: "Danger, expenses, overdue items", color: "bg-rose-500" },
  { label: "Yellow", text: "Warnings and upcoming renewals", color: "bg-amber-400" },
  { label: "Blue", text: "Debt tools and secondary actions", color: "bg-blue-500" },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-950 transition-colors duration-500 dark:bg-black dark:text-white">
      <div className="pointer-events-none absolute left-[-12rem] top-[-10rem] h-96 w-96 rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-500/15" />
      <div className="pointer-events-none absolute right-[-10rem] top-16 h-96 w-96 rounded-full bg-blue-300/40 blur-3xl dark:bg-blue-500/20" />
      <div className="pointer-events-none absolute left-1/3 top-[42rem] h-96 w-96 rounded-full bg-amber-200/60 blur-3xl dark:bg-rose-500/10" />

      <header className="sticky top-4 z-20 mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <nav className="glass-card flex items-center justify-between gap-3 rounded-3xl px-4 py-3">
          <a href="#top" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white shadow-lg shadow-slate-950/20 dark:bg-white dark:text-black">
              F
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">Finora</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manual finance tracker</p>
            </div>
          </a>

          <div className="hidden items-center gap-1 rounded-full bg-white/60 p-1 text-sm font-medium text-slate-600 shadow-inner dark:bg-white/5 dark:text-slate-300 lg:flex">
            <a href="#features" className="rounded-full px-4 py-2 transition hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-black">
              Features
            </a>
            <a href="#modules" className="rounded-full px-4 py-2 transition hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-black">
              Modules
            </a>
            <a href="#how-it-works" className="rounded-full px-4 py-2 transition hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-black">
              How it works
            </a>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-slate-200 bg-white/70 px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:text-blue-300"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="hidden rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 sm:block"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <section id="top" className="relative mx-auto w-full max-w-7xl px-5 pt-16 sm:px-8 lg:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Track money manually. Stay in control.
            </div>
            <h1 className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              Your money, <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">clearly tracked.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Finora is a manual finance tracker for income, expenses, subscriptions, debts, monthly plans, and reports.
              No bank connection — everything is based on what you enter.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={user ? "/dashboard" : "/register"}
                className="rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-600/25 transition hover:bg-emerald-500"
              >
                {user ? "Go to dashboard" : "Create account"}
              </Link>
              <Link
                href={user ? "/dashboard" : "/login"}
                className="rounded-full border border-slate-200 bg-white/70 px-7 py-3.5 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                {user ? "Open app" : "Log in"}
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Income
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Expenses
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Subscriptions
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Debts
              </span>
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Dashboard preview</p>
                <h2 className="text-2xl font-black">August overview</h2>
              </div>
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-bold text-blue-600 dark:text-blue-300">USD</span>
            </div>

            <div className="mb-5 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Estimated balance</p>
              <p className="mt-2 text-4xl font-black text-emerald-600 dark:text-emerald-400">$4,215.45</p>
              <div className="mt-3 flex gap-6 text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  In <span className="font-bold text-emerald-600 dark:text-emerald-400">+$3,115</span>
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Out <span className="font-bold text-rose-600 dark:text-rose-400">-$1,900</span>
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                ["Salary", "Income • USD", "+$3,000", "text-emerald-600 dark:text-emerald-400"],
                ["Apartment rent", "Expense • Recurring", "-$800", "text-rose-600 dark:text-rose-400"],
                ["Marcus paid back", "Debt • They owe me", "+$150", "text-blue-600 dark:text-blue-400"],
                ["Netflix", "Subscription • Monthly", "-$10.99", "text-amber-600 dark:text-amber-300"],
              ].map(([title, meta, amount, tone]) => (
                <div key={title as string} className="flex items-center justify-between rounded-2xl bg-white/60 p-3 dark:bg-white/[0.03]">
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{meta}</p>
                  </div>
                  <p className={`font-black ${tone}`}>{amount}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Why Finora</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">Everything you need to understand your money.</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            A private, manual tracker. Your balance and insights are calculated only from the information you enter.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {colors.map((item) => (
            <div key={item.label} className="glass-card rounded-3xl p-5">
              <div className={`mb-4 h-3 w-16 rounded-full ${item.color}`} />
              <h3 className="font-black">{item.label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="modules" className="relative mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Modules</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">Six tools, one overview.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <div key={module.title} className="glass-card group rounded-3xl p-6 transition hover:-translate-y-0.5">
              <div className="mb-4 flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${module.color}`} />
                <h3 className="text-lg font-black">{module.title}</h3>
              </div>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{module.text}</p>
              <Link
                href={user ? "/dashboard" : "/login"}
                className="mt-4 inline-flex text-sm font-bold text-blue-600 transition hover:text-blue-500 dark:text-blue-400"
              >
                {user ? "Open module" : "Sign in"} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="relative mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">How it works</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">Started in under a minute.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="glass-card rounded-3xl p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white dark:bg-white dark:text-black">
                {step.number}
              </div>
              <h3 className="text-lg font-black">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
        <div className="glass-card relative overflow-hidden rounded-[2.5rem] p-10 text-center sm:p-14">
          <div className="pointer-events-none absolute left-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute right-[-6rem] bottom-[-6rem] h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <h2 className="relative text-4xl font-black tracking-tight sm:text-5xl">Ready to take control?</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-slate-600 dark:text-slate-300">
            Create your account, set your currency and starting balance, and start tracking today.
          </p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={user ? "/dashboard" : "/register"}
              className="rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-600/25 transition hover:bg-emerald-500"
            >
              {user ? "Open dashboard" : "Create account"}
            </Link>
            {!user ? (
              <Link
                href="/login"
                className="rounded-full border border-slate-200 bg-white/70 px-7 py-3.5 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                I already have an account
              </Link>
            ) : null}
          </div>
          <p className="relative mt-6 text-sm text-slate-500 dark:text-slate-400">
            No bank connection. No real accounts. Your data stays based on what you enter.
          </p>
        </div>
      </section>

      <footer className="relative mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200/70 pt-8 dark:border-white/10 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white dark:bg-white dark:text-black">
              F
            </div>
            <div>
              <p className="text-sm font-bold">Finora</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manual finance tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="transition hover:text-blue-600 dark:hover:text-blue-400">
              Features
            </a>
            <a href="#modules" className="transition hover:text-blue-600 dark:hover:text-blue-400">
              Modules
            </a>
            <a href="#how-it-works" className="transition hover:text-blue-600 dark:hover:text-blue-400">
              How it works
            </a>
            <Link href={user ? "/dashboard" : "/login"} className="transition hover:text-blue-600 dark:hover:text-blue-400">
              {user ? "Dashboard" : "Log in"}
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Finora gives you financial insight based only on the information you manually provide.
        </p>
      </footer>
    </main>
  );
}