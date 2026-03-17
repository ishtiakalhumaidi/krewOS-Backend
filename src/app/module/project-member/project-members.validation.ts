import { z } from "zod";
import { ProjectRole } from "../../../generated/prisma/enums";

export const addProjectMemberSchema = z.object({
  projectId: z.uuid("Invalid project ID format"),

  userId: z.string().min(1, "User ID is required"),

  role: z.nativeEnum(ProjectRole),
});
export const updateProjectMemberSchema = z.object({
  role: z.nativeEnum(ProjectRole),
});
