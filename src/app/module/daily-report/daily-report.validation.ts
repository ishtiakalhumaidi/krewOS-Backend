import { z } from "zod";
import { WeatherCondition } from "../../../generated/prisma/enums";

export const createDailyReportSchema = z.object({
  projectId: z.uuid("Invalid project ID format"),

  reportDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid report date format"),

  summary: z
    .string()
    .min(5, "Summary must be at least 5 characters")
    .max(1000, "Summary must be at most 1000 characters"),

  workersPresent: z.number().min(0, "Workers present cannot be negative"),

  weatherCondition: z.nativeEnum(WeatherCondition),

  photoUrls: z.url("Invalid photo URL").optional(),

  pdfUrl: z.url("Invalid PDF URL").optional(),
});

export const updateDailyReportSchema = z.object({
  summary: z
    .string()
    .min(5, "Summary must be at least 5 characters")
    .max(1000, "Summary must be at most 1000 characters")
    .optional(),

  workersPresent: z
    .number()
    .min(0, "Workers present cannot be negative")
    .optional(),

  weatherCondition: z.nativeEnum(WeatherCondition).optional(),

  photoUrls: z.array(z.string().url("Invalid photo URL")).optional(),

  pdfUrl: z.url("Invalid PDF URL").optional(),
});
