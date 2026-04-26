import { z } from "zod";

export const createProjectSchema = z
  .object({

   
    name: z
      .string()
      .min(2, "Project name must be at least 2 characters")
      .max(100, "Project name must be at most 100 characters"),

    description: z
      .string()
      .min(5, "Description must be at least 5 characters")
      .max(500, "Description must be at most 500 characters"),

    location: z
      .string()
      .min(5, "Location must be at least 5 characters")
      .max(200, "Location must be at most 200 characters"),

    startDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), "Invalid start date format"),

    endDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), "Invalid end date format"),
  })
  .refine((data) => Date.parse(data.endDate) >= Date.parse(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });
export const updateProjectSchema = z.object({
  name: z.string().min(1, "Project name cannot be empty").optional(),
  location: z.string().min(1, "Location cannot be empty").optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"]).optional(),
});

export const ProjectValidation = {
  createProjectSchema,
  updateProjectSchema, 
};