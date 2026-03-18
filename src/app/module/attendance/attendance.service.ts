import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import type { IClockIn } from "./attendance.interface";

const clockIn = async (payload: IClockIn) => {
  // 1. Verify they are actually assigned to this project
  const isMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: payload.projectId,
        userId: payload.userId,
      },
    },
  });

  if (!isMember) {
    // throw new Error("Worker is not assigned to this project site");
    throw new AppError(
      status.FORBIDDEN,
      "Worker is not assigned to this project site",
    );
  }

  // 2. Prevent duplicate clock-ins for today.
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  const existingAttendance = await prisma.attendance.findFirst({
    where: {
      projectId: payload.projectId,
      userId: payload.userId,
      clockIn: {
        gte: today,
      },
    },
  });

  if (existingAttendance) {
    throw new AppError(status.CONFLICT, "Worker has already clocked in today");
  }

  // 3. Create the clock-in record
  const result = await prisma.attendance.create({
    data: {
      projectId: payload.projectId,
      userId: payload.userId,
      method: payload.method,
      gpsLocation: payload.gpsLocation,
    },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return result;
};

const clockOut = async (attendanceId: string, userId: string) => {
  const existingRecord = await prisma.attendance.findUnique({
    where: { id: attendanceId },
  });

  if (!existingRecord) {
    throw new AppError(status.NOT_FOUND, "Attendance record not found");
  }

  if (existingRecord.userId !== userId) {
    throw new AppError(
      status.FORBIDDEN,
      "You can only clock out your own attendance record",
    );
  }
  if (existingRecord.clockOut) {
    throw new AppError(status.CONFLICT, "Worker has already clocked out today");
  }

  const clockOutTime = new Date();

  const diffInMilliseconds =
    clockOutTime.getTime() - existingRecord.clockIn.getTime();
  const hoursWorked = Number(
    (diffInMilliseconds / (1000 * 60 * 60)).toFixed(2),
  );

  const result = await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      clockOut: clockOutTime,
      hoursWorked: hoursWorked,
    },
  });

  return result;
};

const getProjectAttendanceToday = async (projectId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await prisma.attendance.findMany({
    where: {
      projectId: projectId,
      clockIn: { gte: today },
    },
    include: {
      user: { select: { name: true } },
    },
    orderBy: { clockIn: "desc" },
  });

  return result;
};

const getWorkerMonthlyStats = async (
  userId: string,
  year: number,
  month: number,
) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const stats = await prisma.attendance.aggregate({
    where: {
      userId: userId,
      clockIn: {
        gte: startDate,
        lt: endDate,
      },
      hoursWorked: {
        not: null,
      },
    },
    _sum: {
      hoursWorked: true,
    },
    _count: {
      id: true,
    },
  });

  return {
    year,
    month,
    totalHoursWorked: stats._sum.hoursWorked || 0,
    totalShiftsCompleted: stats._count.id,
  };
};

// Don't forget to export it!
export const AttendanceService = {
  clockIn,
  clockOut,
  getProjectAttendanceToday,
  getWorkerMonthlyStats,
};
