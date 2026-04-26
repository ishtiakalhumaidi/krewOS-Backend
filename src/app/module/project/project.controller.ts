/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ProjectService } from "./project.service";
import AppError from "../../errorHelpers/AppError";

const createProject = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  console.log(payload);
  payload.ownerId = (req as any).user.userId;
  payload.companyId = (req as any).user.companyId;
  const result = await ProjectService.createProject(payload);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Project site created successfully",
    data: result,
  });
});

const getCompanyProjects = catchAsync(async (req: Request, res: Response) => {
  const companyId = (req as any).user.companyId;

  // Pass req.query to the service
  const result = await ProjectService.getCompanyProjects(
    companyId as string,
    req.query,
  );
  

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Projects retrieved successfully",
    meta: result.meta, // Now your response will include page, limit, total, totalPages
    data: result.data,
  });
});


const getMyProjects = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId; // Extract the logged-in worker

  const result = await ProjectService.getMyProjects(userId, req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Your assigned projects retrieved successfully",
    meta: result.meta, 
    data: result.data,
  });
});
const getProjectById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user; 
  const { projectId } = req.params;

  const result = await ProjectService.getProjectById(projectId as string, user.companyId as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Project details retrieved successfully",
    data: result,
  });
});

const updateProject = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const companyId = req.user?.companyId;

  if (!companyId) {
    throw new AppError(status.UNAUTHORIZED, "Company ID is missing");
  }

  const result = await ProjectService.updateProject(
    projectId as string,
    companyId,
    req.body
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Project updated successfully",
    data: result,
  });
});
export const ProjectController = {
  createProject,
  getCompanyProjects,
  getProjectById,
  getMyProjects,
  updateProject,
};
