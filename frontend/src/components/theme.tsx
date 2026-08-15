"use client";

import { createContext, useContext, useEffect, useState } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const toggle = () => setDarkMode((value) => !value);

  return (
    <ThemeContext.Provider value={{ darkMode, toggle }}>{children}</ThemeContext.Provider>
  );
}

type ThemeContextValue = {
  darkMode: boolean;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

export function ThemeToggle() {
  const { darkMode, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:text-blue-300"
    >
      {darkMode ? "Light" : "Dark"}
    </button>
  );
}