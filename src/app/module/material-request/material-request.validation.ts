import { z } from "zod";
import { RequestStatus } from "../../../generated/prisma/enums";

export const createMaterialSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  itemName: z.string().min(2, "Item name must be at least 2 characters"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required (e.g., kg, bags, pieces)"),
  notes: z.string().optional(),
});

export const updateMaterialStatusSchema = z.object({
  status: z.nativeEnum(RequestStatus),
});