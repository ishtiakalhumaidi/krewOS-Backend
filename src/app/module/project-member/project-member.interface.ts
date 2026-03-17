import { ProjectRole } from "../../../generated/prisma/enums";

export interface IAddProjectMember {
  projectId: string;
  userId: string;
  role?: ProjectRole;
}
export interface IUpdateProjectMemberRole {
  role: ProjectRole; 
}