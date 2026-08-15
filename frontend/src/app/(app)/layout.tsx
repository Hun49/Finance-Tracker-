"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthGuard } from "../../components/auth-guard";
import { ThemeToggle } from "../../components/theme";
import { useAuth } from "../../lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/income", label: "Income" },
  { href: "/expenses", label: "Expenses" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/debts", label: "Debts" },
  { href: "/planner", label: "Planner" },
  { href: "/reports", label: "Reports" },
  { href: "/ai", label: "AI Assistant" },
  { href: "/settings", label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <AuthGuard>
      <main className="relative min-h-screen overflow-hidden bg-white text-slate-950 transition-colors dark:bg-black dark:text-white">
        <div className="pointer-events-none fixed left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-500/10" />
        <div className="pointer-events-none fixed bottom-[-8rem] right-[-8rem] h-72 w-72 rounded-full bg-blue-300/30 blur-3xl dark:bg-blue-500/10" />

        <div className="relative mx-auto flex w-full max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <aside className="glass-card hidden h-fit w-64 shrink-0 rounded-3xl p-4 lg:block">
            <div className="mb-6 flex items-center gap-3 px-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-base font-black text-white dark:bg-white dark:text-black">
                F
              </div>
              <div>
                <p className="text-sm font-bold">Finora</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manual tracker</p>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                        : "text-slate-600 hover:bg-white/60 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Main currency</p>
              <p className="mt-1 text-2xl font-black">{profile?.mainCurrency ?? "—"}</p>
              <button onClick={handleLogout} className="mt-4 w-full rounded-full bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-300">
                Log out
              </button>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <header className="glass-card mb-5 flex items-center justify-between rounded-3xl px-5 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Welcome back</p>
                <p className="font-black">{user?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link
                  href="/settings"
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
                >
                  Settings
                </Link>
              </div>
            </header>

            <div className="lg:hidden">
              <nav className="glass-card mb-5 flex gap-1 overflow-x-auto rounded-3xl p-1.5">
                {navItems.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                        active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-white/60 dark:text-slate-300"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {children}
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}