/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProjectRole } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type {
  ICreateDailyReport,
  IUpdateDailyReport,
} from "./daily-report.interface";

const createReport = async (payload: ICreateDailyReport) => {
  // 1. Ensure the user is actually a member of the project
  const isMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: payload.projectId,
        userId: payload.submittedBy,
      },
    },
  });

  if (!isMember) {
    throw new Error(
      "You must be a member of this project to submit a daily report",
    );
  }

  // 2.THE CALCULATION LOGIC

  const totalWorkers = await prisma.projectMember.count({
    where: {
      projectId: payload.projectId,
      role: ProjectRole.WORKER,
    },
  });
  if (payload.workersPresent > totalWorkers) {
    throw new Error("Present workers cannot be greater than total workers");
  }
  
  const workersAbsent = Math.max(0, totalWorkers - payload.workersPresent);

  try {
    // 3. Create the report
    const result = await prisma.dailySiteReport.create({
      data: {
        ...payload,
        totalWorkers: totalWorkers, // Calculated by Prisma
        workersAbsent: workersAbsent, // Calculated by our math
        reportDate: new Date(payload.reportDate),
      },
      include: {
        submitter: {
          select: { name: true, email: true },
        },
      },
    });

    return result;
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error(
        "A daily report has already been submitted for this project on this date. Please update the existing report instead.",
        { cause: error },
      );
    }
    throw new Error("Failed to submit daily report", { cause: error });
  }
};

const getProjectReports = async (projectId: string) => {
  const result = await prisma.dailySiteReport.findMany({
    where: { projectId },
    orderBy: { reportDate: "desc" },
    include: {
      submitter: {
        select: { name: true, email: true },
      },
    },
  });
  return result;
};

const updateReport = async (reportId: string, payload: IUpdateDailyReport) => {
  try {
    const result = await prisma.dailySiteReport.update({
      where: { id: reportId },
      data: payload,
    });
    return result;
  } catch (error: any) {
    if (error.code === "P2025") {
      throw new Error("Daily report not found", { cause: error });
    }
    throw new Error("Failed to update daily report", { cause: error });
  }
};

export const DailyReportService = {
  createReport,
  getProjectReports,
  updateReport,
};
