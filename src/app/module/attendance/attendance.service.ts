import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import type { IClockIn } from "./attendance.interface";
import { ProjectRole, UserRole } from "../../../generated/prisma/enums";

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

const clockOut = async (attendanceId: string, requesterId: string, requesterRole: string) => {
  const existingRecord = await prisma.attendance.findUnique({
    where: { id: attendanceId },
  });

  if (!existingRecord) {
    throw new AppError(status.NOT_FOUND, "Attendance record not found");
  }

  // 🛡️ OVERRIDE LOGIC: If the user is not clocking themselves out
  if (existingRecord.userId !== requesterId) {
    // If they aren't a Global Admin/Owner...
    if (requesterRole !== UserRole.OWNER && requesterRole !== UserRole.ADMIN && requesterRole !== UserRole.SUPER_ADMIN) {
      // ...Check if they are a Site Manager or Project Manager on this specific site
      const isManager = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: existingRecord.projectId, userId: requesterId } }
      });

      if (!isManager || (isManager.role !== ProjectRole.PROJECT_MANAGER && isManager.role !== ProjectRole.SITE_MANAGER)) {
        throw new AppError(
          status.FORBIDDEN,
          "You do not have permission to clock out this worker"
        );
      }
    }
  }

  if (existingRecord.clockOut) {
    throw new AppError(status.CONFLICT, "Worker has already clocked out today");
  }

  const clockOutTime = new Date();
  const diffInMilliseconds = clockOutTime.getTime() - existingRecord.clockIn.getTime();
  const hoursWorked = Number((diffInMilliseconds / (1000 * 60 * 60)).toFixed(2));

  const result = await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      clockOut: clockOutTime,
      hoursWorked: hoursWorked,
    },
  });

  return result;
};
const getMyTodayAttendance = async (projectId: string, userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await prisma.attendance.findFirst({
    where: {
      projectId: projectId,
      userId: userId,
      clockIn: { gte: today },
    },
  });
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
      clockIn: { gte: startDate, lt: endDate },
      hoursWorked: { not: null },
    },
    _sum: { hoursWorked: true },
    _count: { id: true },
  });

  const logs = await prisma.attendance.findMany({
    where: {
      userId: userId,
      clockIn: { gte: startDate, lt: endDate },
    },
    include: {
      project: { select: { name: true, location: true } }
    },
    orderBy: { clockIn: "desc" }
  });

  return {
    year,
    month,
    totalHoursWorked: stats._sum.hoursWorked || 0,
    totalShiftsCompleted: stats._count.id,
    logs, // 👉 Return the logs to the frontend!
  };
};

const getCompanyTimesheets = async (companyId: string, startDate: string, endDate: string) => {
  
  const attendances = await prisma.attendance.findMany({
    where: {
      project: { companyId: companyId },
      clockIn: {
        gte: new Date(startDate), // Greater than or equal to start date
        lte: new Date(endDate),   // Less than or equal to end date
      },
      clockOut: { not: null }     // Only calculate finished shifts!
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      project: { select: { name: true } }
    }
  });

  // 2. Aggregate the hours per User
  const timesheetMap = new Map();

  attendances.forEach((record) => {
    if (!timesheetMap.has(record.userId)) {
      timesheetMap.set(record.userId, {
        userId: record.user.id,
        name: record.user.name,
        email: record.user.email,
        totalHours: 0,
        shifts: 0,
        projects: new Set()
      });
    }

    const userStat = timesheetMap.get(record.userId);
    userStat.totalHours += (record.hoursWorked || 0);
    userStat.shifts += 1;
    userStat.projects.add(record.project.name);
  });

  // 3. Format the final array for the frontend
  const timesheets = Array.from(timesheetMap.values()).map(stat => ({
    ...stat,
    totalHours: Number(stat.totalHours.toFixed(2)),
    projects: Array.from(stat.projects)
  }));

  return timesheets;
};

// Don't forget to export it!
export const AttendanceService = {
  clockIn,
  clockOut,
  getProjectAttendanceToday,
  getWorkerMonthlyStats,
  getMyTodayAttendance,
  getCompanyTimesheets

};
