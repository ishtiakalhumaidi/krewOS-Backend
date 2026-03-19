import { z } from "zod";

export const updateCompanySchema = z.object({
  name: z.string().min(2).max(100).optional(),

  email: z.email("Invalid email format").optional(),

  phone: z.string().min(7).max(20).optional(),
});
