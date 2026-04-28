/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { SafetyChecklistService } from "./safety-checklist.service";

const createChecklist = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  payload.submittedBy = (req as any).user.userId;
  const result = await SafetyChecklistService.createChecklist(payload);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Safety checklist submitted successfully",
    data: result,
  });
});

const getProjectChecklists = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const result = await SafetyChecklistService.getProjectChecklists(
    projectId as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Safety checklists retrieved successfully",
    data: result,
  });
});
const getCompanyChecklists = catchAsync(async (req: Request, res: Response) => {
  const companyId = (req as any).user.companyId;
  const result = await SafetyChecklistService.getCompanyChecklists(companyId, req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Company safety checklists retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});
export const SafetyChecklistController = {
  createChecklist,
  getProjectChecklists,
  getCompanyChecklists,
};
