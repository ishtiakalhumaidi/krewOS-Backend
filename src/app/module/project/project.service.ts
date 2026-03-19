import status from "http-status";
import { ProjectRole, SubscriptionPlan } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import type { ICreateProject } from "./project.interface";
import { PLAN_LIMITS } from "../../config/subscriptionLimits";

const createProject = async (payload: ICreateProject) => {
  // 1. Get the company and count their current projects
  const company = await prisma.company.findUnique({
    where: { id: payload.companyId },
    include: {
      subscription: true,
      _count: { select: { projects: true } },
    },
  });

  if (!company) {
    throw new AppError(status.NOT_FOUND, "Company not found");
  }

  // 2. Determine their limits
  const currentPlan = company.subscription?.plan || SubscriptionPlan.FREE;
  const limit = PLAN_LIMITS[currentPlan].maxProjects;

  // 3. The Gatekeeper Check
  if (company._count.projects >= limit) {
    throw new AppError(
      status.FORBIDDEN,
      `Upgrade Required: Your ${currentPlan} plan is limited to ${limit} project(s).`,
    );
  }

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
