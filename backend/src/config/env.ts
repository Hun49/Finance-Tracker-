import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(24),
  JWT_REFRESH_SECRET: z.string().min(24),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Finance Tracker <onboarding@resend.dev>"),
  EXCHANGE_RATE_BASE_URL: z.string().url().default("https://api.frankfurter.app"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-3.6-flash"),
});

export const env = envSchema.parse(process.env);
