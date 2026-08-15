"use client";

import { useEffect, useRef, useState } from "react";

type ConfirmButtonProps = {
  onConfirm: () => void;
  label?: string;
  className?: string;
  title?: string;
  busy?: boolean;
};

export function ConfirmButton({ onConfirm, label = "✕", className = "", title = "Delete", busy }: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleClick() {
    if (!armed) {
      setArmed(true);
      timerRef.current = setTimeout(() => setArmed(false), 3000);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setArmed(false);
    onConfirm();
  }

  return (
    <button
      type="button"
      title={title}
      disabled={busy}
      onClick={handleClick}
      className={`${className} transition ${
        armed ? "scale-105 bg-rose-600 text-white shadow-lg shadow-rose-600/40" : ""
      }`}
    >
      {busy ? "…" : armed ? "Sure?" : label}
    </button>
  );
}