/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { DashboardService } from "./dashboard.service";

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;

  const result = await DashboardService.getDashboardStatsData(user);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Dashboard stats retrieved successfully",
    data: result,
  });
});

export const DashboardController = {
  getDashboardStats,
};