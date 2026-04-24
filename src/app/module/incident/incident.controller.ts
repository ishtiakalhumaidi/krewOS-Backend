/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { IncidentService } from "./incident.service";

const createIncident = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  if (req.files && Array.isArray(req.files)) {
    payload.photoUrls = req.files.map((file: any) => file.path);
  }
  payload.reportedBy = (req as any).user.userId;
  const result = await IncidentService.createIncident(payload);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Safety incident reported successfully",
    data: result,
  });
});

const getProjectIncidents = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const result = await IncidentService.getProjectIncidents(projectId as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Project incident logs retrieved successfully",
    data: result,
  });
});
const getCompanyIncidents = catchAsync(async (req: Request, res: Response) => {
  const companyId = (req as any).user.companyId; // Grab from token!

  const result = await IncidentService.getCompanyIncidents(
    companyId,
    req.query,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Company incidents retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});
const resolveIncident = catchAsync(async (req: Request, res: Response) => {
  const { incidentId } = req.params;
  const payload = req.body;
  const result = await IncidentService.resolveIncident(
    incidentId as string,
    payload,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Incident resolution status updated",
    data: result,
  });
});
const getMyIncidents = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  const result = await IncidentService.getMyIncidents(userId, req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Your reported incidents retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const IncidentController = {
  createIncident,
  getProjectIncidents,
  resolveIncident,
  getMyIncidents,
  getCompanyIncidents,
};
