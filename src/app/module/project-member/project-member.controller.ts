import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ProjectMemberService } from "./project-member.service";

const addMember = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await ProjectMemberService.addMemberToProject(payload);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Worker successfully added to the project",
    data: result,
  });
});

const getMembers = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const result = await ProjectMemberService.getProjectMembers(
    projectId as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Project team retrieved successfully",
    data: result,
  });
});

const removeMember = catchAsync(async (req: Request, res: Response) => {
  const { projectId, userId } = req.params;
  const result = await ProjectMemberService.removeMember(
    projectId as string,
    userId as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Worker removed from the project",
    data: result,
  });
});
const updateRole = catchAsync(async (req: Request, res: Response) => {
  const { projectId, userId } = req.params;
  const payload = req.body;

  const result = await ProjectMemberService.updateMemberRole(
    projectId as string,
    userId as string,
    payload,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: `Worker successfully promoted to ${result.role}`,
    data: result,
  });
});
export const ProjectMemberController = {
  addMember,
  getMembers,
  removeMember,
  updateRole,
};
