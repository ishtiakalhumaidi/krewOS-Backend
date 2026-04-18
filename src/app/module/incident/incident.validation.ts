import { z } from "zod";
import { Severity } from "../../../generated/prisma/enums";

// Create Incident
export const createIncidentSchema = z.object({
  projectId: z
    .uuid("Invalid project ID format"),

  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be at most 100 characters"),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be at most 1000 characters"),

  severity: z.nativeEnum(Severity),

  dateOccurred: z.union([z.string(), z.date()]).refine((date) => {
    const d = typeof date === "string" ? Date.parse(date) : date.getTime();
    return !isNaN(d);
  }, "Invalid date format"),

  photoUrls: z.array(z.string().url("Invalid photo URL")).optional(),
});

// Update Incident Status
export const updateIncidentStatusSchema = z.object({
  isResolved: z.union([
    z.boolean(),
    z.enum(["true", "false"]).transform((val) => val === "true")
  ]),

  resolutionNotes: z
    .string()
    .max(1000, "Resolution notes must be at most 1000 characters")
    .optional(),
});