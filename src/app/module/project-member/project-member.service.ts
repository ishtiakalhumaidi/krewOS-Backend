/* eslint-disable @typescript-eslint/no-explicit-any */

import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { ProjectRole } from "../../../generated/prisma/enums";
import type { IAddProjectMember } from "./project-member.interface";

const addMemberToProject = async (payload: IAddProjectMember) => {
  try {
    const result = await prisma.projectMember.create({
      data: {
        projectId: payload.projectId,
        userId: payload.userId,
        role: payload.role || ProjectRole.WORKER,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return result;
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new AppError(
        status.CONFLICT,
        "User is already a member of this project",
      );
    }

    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to add project member",
    );
  }
};

const getProjectMembers = async (projectId: string) => {
  const result = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return result;
};

const removeMember = async (projectId: string, userId: string) => {
  try {
    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    return {
      message: "Worker removed from the project",
    };
  } catch (error: any) {
    if (error.code === "P2025") {
      throw new AppError(status.NOT_FOUND, "Member not found in this project");
    }

    throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to remove member");
  }
};

const updateMemberRole = async (
  projectId: string,
  userId: string,
  payload: { role: ProjectRole },
) => {
  try {
    const result = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      data: {
        role: payload.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return result;
  } catch (error: any) {
    if (error.code === "P2025") {
      throw new AppError(
        status.NOT_FOUND,
        "Cannot update role: member not found",
      );
    }

    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to update member role",
    );
  }
};

export const ProjectMemberService = {
  addMemberToProject,
  getProjectMembers,
  removeMember,
  updateMemberRole,
};
