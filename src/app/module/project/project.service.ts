import { ProjectRole } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type { ICreateProject } from "./project.interface";

const createProject = async (payload: ICreateProject) => {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        ...payload,
        startDate: payload.startDate ? new Date(payload.startDate) : null,
        endDate: payload.endDate ? new Date(payload.endDate) : null,
      },
    });

    await tx.projectMember.create({
      data: {
        projectId: project.id,
        userId: payload.ownerId,
        role: ProjectRole.PROJECT_MANAGER,
      },
    });

    return project;
  });
};

const getCompanyProjects = async (companyId: string) => {
  const result = await prisma.project.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },

    include: {
      owner: true,
      company: true,

      _count: {
        select: { members: true, tasks: true },
      },
    },
  });
  return result;
};

export const ProjectService = {
  createProject,
  getCompanyProjects,
};
