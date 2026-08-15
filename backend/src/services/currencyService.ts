import { env } from "../config/env";

export async function convertCurrency(amount: number, from: string, to: string) {
  const normalizedFrom = from.toUpperCase();
  const normalizedTo = to.toUpperCase();

  if (normalizedFrom === normalizedTo) {
    return { exchangeRate: 1, convertedAmount: amount };
  }

  const params = new URLSearchParams({
    amount: String(amount),
    from: normalizedFrom,
    to: normalizedTo,
  });

  const response = await fetch(`${env.EXCHANGE_RATE_BASE_URL}/latest?${params}`);

  if (!response.ok) {
    throw Object.assign(new Error("Currency conversion failed"), { status: 502 });
  }

  const data = (await response.json()) as { rates?: Record<string, number> };
  const convertedAmount = data.rates?.[normalizedTo];

  if (typeof convertedAmount !== "number") {
    throw Object.assign(new Error("Currency rate unavailable"), { status: 502 });
  }

  return {
    exchangeRate: convertedAmount / amount,
    convertedAmount,
  };
}
