import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";

export const profileRouter = Router();

profileRouter.use(authenticate);

const profileSchema = z.object({
  mainCurrency: z.string().length(3).transform((value) => value.toUpperCase()),
  startingBalance: z.coerce.number(),
  incomeFrequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "IRREGULAR", "CUSTOM"]),
  expectedIncomeAmount: z.coerce.number().optional().nullable(),
  salaryDay: z.coerce.number().int().min(1).max(31).optional().nullable(),
});

profileRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const profile = await prisma.userProfile.findUnique({ where: { userId: authReq.user.id } });

    res.json({ profile });
  }),
);

profileRouter.post(
  "/onboarding",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const body = profileSchema.parse(req.body);

    const profile = await prisma.userProfile.upsert({
      where: { userId: authReq.user.id },
      create: {
        userId: authReq.user.id,
        mainCurrency: body.mainCurrency,
        startingBalance: body.startingBalance,
        incomeFrequency: body.incomeFrequency,
        expectedIncomeAmount: body.expectedIncomeAmount ?? null,
        salaryDay: body.salaryDay ?? null,
      },
      update: {
        mainCurrency: body.mainCurrency,
        startingBalance: body.startingBalance,
        incomeFrequency: body.incomeFrequency,
        expectedIncomeAmount: body.expectedIncomeAmount ?? null,
        salaryDay: body.salaryDay ?? null,
      },
    });

    res.status(201).json({ profile });
  }),
);

profileRouter.patch(
  "/",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const body = profileSchema.partial().parse(req.body);

    const profile = await prisma.userProfile.update({
      where: { userId: authReq.user.id },
      data: body,
    });

    res.json({ profile });
  }),
);
