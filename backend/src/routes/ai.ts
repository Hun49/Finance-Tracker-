import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate";
import { aiLimiter } from "../middleware/rateLimit";
import { askFinanceAssistant, isAiConfigured } from "../services/aiService";
import { asyncHandler } from "../utils/asyncHandler";

export const aiRouter = Router();

aiRouter.use(authenticate);
aiRouter.use(aiLimiter);

aiRouter.get(
  "/config",
  (_req, res) => {
    res.json({ configured: isAiConfigured() });
  },
);

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
});

aiRouter.post(
  "/chat",
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const body = chatSchema.parse(req.body);
    const answer = await askFinanceAssistant(authReq.user.id, body.message);
    res.json({ answer });
  }),
);