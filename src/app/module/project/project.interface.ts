import { ProjectStatus } from "../../../generated/prisma/enums";

export interface ICreateProject {
  companyId: string;
  ownerId: string;
  name: string;
  description?: string;
  location: string;
  status?: ProjectStatus;
  startDate?: string | Date;
  endDate?: string | Date;
}