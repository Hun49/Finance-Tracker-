import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      issues: error.issues,
    });
  }

  const status = typeof error.status === "number" ? error.status : 500;

  if (status >= 500) {
    console.error(error);
  }

  return res.status(status).json({
    message: error.message || "Internal server error",
  });
};
