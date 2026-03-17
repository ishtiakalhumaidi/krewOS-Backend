import status from "http-status";
import type z from "zod";
import type {
  TErrorResponse,
  TErrorSources,
} from "../interfaces/error.interface";

export const handleZodError = (err: z.ZodError): TErrorResponse => {
  const statusCode = status.BAD_REQUEST;
  const message = "Zod Validation Error.";
  const errorSources: TErrorSources[] = [];
  err.issues.forEach((issue) => {
    errorSources.push({
      path: issue.path.join(" => ") || "unknown",
      message: issue.message,
    });
  });

  return {
    success: false,

    statusCode,
    errorSources,
    message,
  };
};
