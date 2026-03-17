import { z } from "zod";

// -------------------------
// Create Safety Checklist
export const createSafetyChecklistSchema = z.object({
  projectId: z.uuid("Invalid project ID format"),

  submittedBy: z.string().min(1, "SubmittedBy (user ID) is required"),

  checkDate: z.union([z.string(), z.date()]).refine((date) => {
    const d = typeof date === "string" ? Date.parse(date) : date.getTime();
    return !isNaN(d);
  }, "Invalid check date format"),

  checklistData: z.record(z.string(), z.boolean()),

  allClear: z.boolean().optional(),

  notes: z
    .string()
    .max(1000, "Notes must be at most 1000 characters")
    .optional(),
});
