/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AttendanceService } from "./attendance.service";

const clockIn = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  payload.userId = (req as any).user.userId;
  const result = await AttendanceService.clockIn(payload);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Worker successfully clocked in",
    data: result,
  });
});

const clockOut = catchAsync(async (req: Request, res: Response) => {
  const { attendanceId } = req.params;
  const userId = (req as any).user.userId;
  const role = (req as any).user.role;

  const result = await AttendanceService.clockOut(
    attendanceId as string,
    userId,
    role,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Worker successfully clocked out",
    data: result,
  });
});

const getMyTodayAttendance = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = (req as any).user.userId;

  const result = await AttendanceService.getMyTodayAttendance(
    projectId as string,
    userId,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Today's status retrieved",
    data: result,
  });
});
const getProjectAttendanceToday = catchAsync(
  async (req: Request, res: Response) => {
    const { projectId } = req.params;

    const result = await AttendanceService.getProjectAttendanceToday(
      projectId as string,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Today's attendance log retrieved successfully",
      data: result,
    });
  },
);

const getWorkerMonthlyStats = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month =
      parseInt(req.query.month as string) || new Date().getMonth() + 1;

    const result = await AttendanceService.getWorkerMonthlyStats(
      userId as string,
      year,
      month,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Worker monthly statistics retrieved successfully",
      data: result,
    });
  },
);
const getMyTimesheet = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId; // Securely extract the logged-in user
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month =
    parseInt(req.query.month as string) || new Date().getMonth() + 1;

  const result = await AttendanceService.getWorkerMonthlyStats(
    userId,
    year,
    month,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Personal timesheet retrieved successfully",
    data: result,
  });
});

const getTimesheets = catchAsync(async (req: Request, res: Response) => {
  const companyId = (req as any).user.companyId;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res
      .status(status.BAD_REQUEST)
      .json({ message: "startDate and endDate are required" });
  }

  const result = await AttendanceService.getCompanyTimesheets(
    companyId,
    startDate as string,
    endDate as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Timesheets generated successfully",
    data: result,
  });
});
export const AttendanceController = {
  clockIn,
  clockOut,
  getProjectAttendanceToday,
  getWorkerMonthlyStats,
  getMyTodayAttendance,
  getMyTimesheet,
  getTimesheets,
};
