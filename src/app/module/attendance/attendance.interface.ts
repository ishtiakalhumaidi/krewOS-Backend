import { AttendanceMethod } from "../../../generated/prisma/enums";

export interface IClockIn {
  projectId: string;
  userId: string; 
  method?: AttendanceMethod; 
  gpsLocation?: string;     
}