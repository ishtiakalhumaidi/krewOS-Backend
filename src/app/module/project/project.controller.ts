/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ProjectService } from "./project.service";

const createProject = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  payload.ownerId = (req as any).user.userId;
  const result = await ProjectService.createProject(payload);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Project site created successfully",
    data: result,
  });
});

const getCompanyProjects = catchAsync(async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const result = await ProjectService.getCompanyProjects(companyId as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Projects retrieved successfully",
    data: result,
  });
});

export const ProjectController = {
  createProject,
  getCompanyProjects,
};
