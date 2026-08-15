"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, jsonPost } from "../../../lib/api";
import { isAiConfigured } from "../../../lib/ai";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const configured = useQuery({
    queryKey: ["ai-configured"],
    queryFn: () => isAiConfigured(),
    staleTime: 60_000,
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const data = await api<{ answer: string }>("/ai/chat", jsonPost({ message }));
      return data.answer;
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    chatMutation.mutate(trimmed, {
      onSuccess: (answer) => setMessages((prev) => [...prev, { role: "assistant", content: answer }]),
      onError: (error: Error) =>
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${error.message}` }]),
    });
  }

  return (
    <div className="space-y-5">
      <div className="glass-card rounded-3xl p-6">
        <h1 className="text-2xl font-black tracking-tight">AI Assistant</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Ask Finora about your income, expenses, subscriptions, debts, and plans — analyzed from your tracked data.
        </p>
        {configured.data === false ? (
          <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            Note: the Gemini API key isn&apos;t set on the backend, so you&apos;ll get a plain data summary instead of live AI answers.
          </p>
        ) : null}
      </div>

      <div className="glass-card flex h-[28rem] flex-col rounded-3xl p-5">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 text-2xl font-black text-white">
                ✦
              </span>
              <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Ask things like &quot;What am I spending most on?&quot;, &quot;How much debt do I owe?&quot;, or &quot;Review my monthly plan&quot;.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "rounded-br-md bg-blue-600 text-white"
                      : "rounded-bl-md bg-white/70 text-slate-800 dark:bg-white/[0.06] dark:text-slate-100"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
          {chatMutation.isPending ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              Finora is thinking…
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about your finances…"
            className="w-full rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || chatMutation.isPending}
            className="rounded-full bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}