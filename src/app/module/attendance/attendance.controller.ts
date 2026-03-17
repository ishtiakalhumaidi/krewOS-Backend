import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AttendanceService } from "./attendance.service";

const clockIn = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
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
  const result = await AttendanceService.clockOut(attendanceId as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Worker successfully clocked out",
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

export const AttendanceController = {
  clockIn,
  clockOut,
  getProjectAttendanceToday,
};
