import type { Request } from "express";
import { prisma } from "../lib/prisma";
import { convertCurrency } from "./currencyService";
import { httpError } from "../utils/httpError";

export type ConversionInput = {
  amount: number;
  currency: string;
};

export type ConversionResult = {
  amount: number;
  currency: string;
  exchangeRate: number;
  convertedAmount: number;
};

export async function convertToUserCurrency(userId: string, input: ConversionInput): Promise<ConversionResult> {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });

  if (!profile) throw httpError(400, "Complete onboarding before adding transactions");

  const normalizedCurrency = input.currency.toUpperCase();

  if (normalizedCurrency === profile.mainCurrency) {
    return {
      amount: input.amount,
      currency: normalizedCurrency,
      exchangeRate: 1,
      convertedAmount: input.amount,
    };
  }

  let result;
  try {
    result = await convertCurrency(input.amount, normalizedCurrency, profile.mainCurrency);
  } catch {
    throw httpError(400, "Could not convert currency. Check the currency code or try again.");
  }

  return {
    amount: input.amount,
    currency: normalizedCurrency,
    exchangeRate: result.exchangeRate,
    convertedAmount: result.convertedAmount,
  };
}