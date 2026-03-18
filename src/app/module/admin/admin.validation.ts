import { z } from "zod";

export const inviteAdminSchema = z.object({
  email: z.email("Invalid email format"),
});
