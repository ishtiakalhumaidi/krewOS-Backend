/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request, Response } from "express";
import status from "http-status";
import AppError from "../errorHelpers/AppError";
import { prisma } from "../lib/prisma";
import { ProjectRole, UserRole } from "../../generated/prisma/enums";

export const checkProjectRole = (...allowedRoles: ProjectRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      
      const { userId, role: systemRole } = req.user as any;

      
      if (systemRole === UserRole.OWNER || systemRole === UserRole.SUPER_ADMIN) {
        return next();
      }

 
      const projectId = req.params.projectId || req.body.projectId || req.query.projectId;

      if (!projectId) {
        throw new AppError(status.BAD_REQUEST, "Project ID is required for authorization");
      }

  
      const projectMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId }
        }
      });

      if (!projectMember) {
        throw new AppError(status.FORBIDDEN, "You are not assigned to this project site");
      }

     
      if (allowedRoles.length > 0 && !allowedRoles.includes(projectMember.role as ProjectRole)) {
        throw new AppError(
          status.FORBIDDEN, 
          `Your project role (${projectMember.role}) does not have permission for this action`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};