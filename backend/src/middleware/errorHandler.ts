import { Request, Response, NextFunction } from "express";
import { config } from "../config/env";

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Always log the full error for debugging
  console.error("Error:", err.message);
  if (config.nodeEnv !== "production") {
    console.error("Stack:", err.stack);
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: err.message,
      },
    });
    return;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_ID",
        message: "Invalid resource ID format",
      },
    });
    return;
  }

  // Duplicate key error
  if ((err as any).code === 11000) {
    res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_KEY",
        message: "Duplicate value for unique field",
      },
    });
    return;
  }

  // MongoDB session/transaction errors
  if (err.message?.includes("Transaction") || err.message?.includes("session")) {
    res.status(500).json({
      success: false,
      error: {
        code: "TRANSACTION_ERROR",
        message: config.nodeEnv === "production"
          ? "Database operation failed"
          : err.message,
      },
    });
    return;
  }

  // Default internal server error
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: config.nodeEnv === "production"
        ? "An unexpected error occurred"
        : err.message || "An unexpected error occurred",
    },
  });
};
