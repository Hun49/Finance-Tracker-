import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { aiRouter } from "./routes/ai";
import { authRouter } from "./routes/auth";
import { currencyRouter } from "./routes/currency";
import { debtsRouter } from "./routes/debts";
import { expensesRouter } from "./routes/expenses";
import { healthRouter } from "./routes/health";
import { incomeRouter } from "./routes/income";
import { plannerRouter } from "./routes/planner";
import { profileRouter } from "./routes/profile";
import { reportsRouter } from "./routes/reports";
import { subscriptionsRouter } from "./routes/subscriptions";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.NODE_ENV === "production" ? env.FRONTEND_URL : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/currency", currencyRouter);
app.use("/api/profile", profileRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/income", incomeRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/debts", debtsRouter);
app.use("/api/planner", plannerRouter);
app.use("/api/ai", aiRouter);

app.use(errorHandler);
