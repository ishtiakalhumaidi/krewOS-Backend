import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { MaterialRequestService } from "./material-request.service";

const createRequest = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await MaterialRequestService.createRequest(payload);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Material request submitted successfully",
    data: result,
  });
});

const getProjectRequests = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const result = await MaterialRequestService.getProjectRequests(
    projectId as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Material requests retrieved successfully",
    data: result,
  });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const payload = req.body;
  const result = await MaterialRequestService.updateRequestStatus(
    requestId as string,
    payload,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: `Material request marked as ${result.status}`,
    data: result,
  });
});

export const MaterialRequestController = {
  createRequest,
  getProjectRequests,
  updateStatus,
};
