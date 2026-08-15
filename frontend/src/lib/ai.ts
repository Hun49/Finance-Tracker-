import { api } from "./api";

export async function isAiConfigured(): Promise<boolean> {
  const data = await api<{ configured: boolean }>("/ai/config");
  return data.configured;
}