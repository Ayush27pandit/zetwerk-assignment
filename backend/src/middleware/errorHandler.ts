import { Request, Response, NextFunction } from "express";

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

  // Default internal server error
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  });
};
