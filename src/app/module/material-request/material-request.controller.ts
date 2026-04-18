/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { MaterialService } from "./material-request.service";

const createRequest = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  payload.requestedBy = (req as any).user.userId;

  const result = await MaterialService.createRequest(payload);
  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Material requested successfully",
    data: result,
  });
});

const getMyRequests = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const result = await MaterialService.getMyRequests(userId, req.query);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Your requests retrieved",
    meta: result.meta,
    data: result.data,
  });
});

const getProjectRequests = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const result = await MaterialService.getProjectRequests(projectId as string);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Project requests retrieved",
    data: result,
  });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const payload = req.body;


  // If status is APPROVED/REJECTED, log who did it
  if (payload.status === "APPROVED" || payload.status === "REJECTED") {
    payload.approvedBy = (req as any).user.userId;
  }

  // 👉 FIXED: Corrected the TypeScript casting to safely grab the Multer file path
  if (req.file) {
    payload.deliveryPhotoUrl = (req as any).file.path;
  }

  const result = await MaterialService.updateStatus(requestId as string, payload);
  
  sendResponse(res, { 
    statusCode: status.OK, 
    success: true, 
    message: `Request marked as ${payload.status}`, 
    data: result 
  });
});
export const MaterialController = {
  createRequest,
  getMyRequests,
  getProjectRequests,
  updateStatus,
};
