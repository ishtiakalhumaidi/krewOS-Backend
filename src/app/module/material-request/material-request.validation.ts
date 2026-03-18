import { z } from "zod";
import { RequestStatus } from "../../../generated/prisma/enums";

export const createMaterialRequestSchema = z.object({
  projectId: z.uuid("Invalid project ID format"),

  itemName: z
    .string()
    .min(2, "Item name must be at least 2 characters")
    .max(100, "Item name must be at most 100 characters"),

  quantity: z.number().min(1, "Quantity must be at least 1"),

  unit: z
    .string()
    .min(1, "Unit is required")
    .max(50, "Unit must be at most 50 characters"),

  notes: z.string().max(500, "Notes must be at most 500 characters").optional(),
});

// Update Material Request Status
export const updateMaterialRequestStatusSchema = z.object({
  projectId: z.uuid("Project ID is required for authorization"),
  status: z.nativeEnum(RequestStatus),

  notes: z.string().max(500, "Notes must be at most 500 characters").optional(),

  deliveryPhotoUrl: z.string().url("Invalid delivery photo URL").optional(),
});
