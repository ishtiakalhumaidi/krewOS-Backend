/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { DailyReportService } from "./daily-report.service";

const createReport = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  payload.submittedBy = (req as any).user.userId;
  if (req.files && Array.isArray(req.files)) {
    payload.photoUrls = req.files.map((file: any) => file.path);
  }

  const result = await DailyReportService.createReport(payload);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Daily site report submitted successfully",
    data: result,
  });
});

const getProjectReports = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const result = await DailyReportService.getProjectReports(
    projectId as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Daily reports retrieved successfully",
    data: result,
  });
});

const updateReport = catchAsync(async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const payload = req.body;
  const result = await DailyReportService.updateReport(
    reportId as string,
    payload,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Daily report updated successfully",
    data: result,
  });
});

export const DailyReportController = {
  createReport,
  getProjectReports,
  updateReport,
};
