import { z } from "zod";
import { TaskPriority, TaskStatus } from "../../../generated/prisma/enums";

// -------------------------
// Create Task
export const createTaskSchema = z.object({
  projectId: z.uuid("Invalid project ID format"),

  assignedTo: z
    .string()
    .min(1, "AssignedTo must be at least 1 character")
    .optional(),

  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be at most 100 characters"),

  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .optional(),

  status: z.nativeEnum(TaskStatus).optional(),

  priority: z.nativeEnum(TaskPriority).optional(),

  dueDate: z
    .union([z.string(), z.date()])
    .refine(
      (date) => {
        const d = typeof date === "string" ? Date.parse(date) : date.getTime();
        return !isNaN(d);
      },
      { message: "Invalid due date" },
    )
    .optional(),
});

// -------------------------
// Update Task (partial)
export const updateTaskSchema = z.object({
  projectId: z.uuid("Project ID is required for authorization"),
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be at most 100 characters")
    .optional(),

  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .optional(),

  assignedTo: z
    .string()
    .min(1, "AssignedTo must be at least 1 character")
    .optional(),

  status: z.nativeEnum(TaskStatus).optional(),

  priority: z.nativeEnum(TaskPriority).optional(),

  dueDate: z
    .union([z.string(), z.date()])
    .refine(
      (date) => {
        const d = typeof date === "string" ? Date.parse(date) : date.getTime();
        return !isNaN(d);
      },
      { message: "Invalid due date" },
    )
    .optional(),
});
