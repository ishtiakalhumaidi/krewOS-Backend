/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request, Response } from "express";
import { envVars } from "../../config/env";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (envVars.NODE_ENV === "development") {
    console.error("Error:", err);
  }

  const statusCode: number = 500;
  const message: string = "Internal Server Error";

  res.status(statusCode).json({
    message: message,
    error: err.message || "An unexpected error occurred",
  });
};
