import { Router } from "express";
import { z } from "zod";
import { convertCurrency } from "../services/currencyService";

export const currencyRouter = Router();

const convertQuerySchema = z.object({
  amount: z.coerce.number().positive(),
  from: z.string().length(3),
  to: z.string().length(3),
});

currencyRouter.get("/convert", async (req, res, next) => {
  try {
    const query = convertQuerySchema.parse(req.query);
    const result = await convertCurrency(query.amount, query.from, query.to);
    res.json({
      amount: query.amount,
      from: query.from.toUpperCase(),
      to: query.to.toUpperCase(),
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

currencyRouter.get("/supported", (_req, res) => {
  res.json({
    currencies: ["USD", "EUR", "GBP", "CAD", "AUD", "AED", "ETB", "JPY", "CHF", "CNY"],
  });
});
