import { z } from "zod";
import { AttendanceMethod } from "../../../generated/prisma/enums";

export const clockInSchema = z.object({
  projectId: z.uuid("Invalid project ID format"),

 

  method: z.nativeEnum(AttendanceMethod).optional(),

  gpsLocation: z
    .string()
    .min(5, "GPS location is too short")
    .max(100, "GPS location is too long")
    .optional(),
});
