/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request, Response } from "express";
import { envVars } from "../config/env";
import z from "zod";
import type {
  TErrorResponse,
  TErrorSources,
} from "../interfaces/error.interface";
import { handleZodError } from "../errorHelpers/handleZodError";
import status from "http-status";
import AppError from "../errorHelpers/AppError";
import { deleteFileFormCloudinary } from "../config/cloudinary.config";

export const globalErrorHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (envVars.NODE_ENV === "development") {
    console.error("Error:", err);
  }

  if (req.file) {
    await deleteFileFormCloudinary(req.file.path);
  }
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const imageUrls = req.files.map((file) => file.path);
    await Promise.all(imageUrls.map((url) => deleteFileFormCloudinary(url)));
  }

  let errorSources: TErrorSources[] = [];
  let statusCode: number = 500;
  let message: string = "Internal Server Error";
  let stack: string | undefined = undefined;

  if (err instanceof z.ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode as number;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
    stack = err.stack;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    stack = err.stack;
    errorSources = [{ path: "", message: err.message }];
  } else if (err instanceof Error) {
    statusCode = status.INTERNAL_SERVER_ERROR;
    message = err.message;
    stack = err.stack;
    errorSources = [{ path: "", message: err.message }];
  }

  const errorResponse: TErrorResponse = {
    success: false,
    message: message,
    errorSources,
    stack: envVars.NODE_ENV === "development" ? stack : undefined,
    error:
      envVars.NODE_ENV === "development" ? err : "An unexpected error occurred",
  };
  res.status(statusCode).json(errorResponse);
};
