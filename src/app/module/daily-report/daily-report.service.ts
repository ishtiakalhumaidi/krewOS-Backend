/* eslint-disable @typescript-eslint/no-explicit-any */

import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { ProjectRole } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type {
  ICreateDailyReport,
  IUpdateDailyReport,
} from "./daily-report.interface";

const createReport = async (payload: ICreateDailyReport) => {
  // 1. Ensure member
  const isMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: payload.projectId,
        userId: payload.submittedBy,
      },
    },
  });

  if (!isMember) {
    throw new AppError(
      status.FORBIDDEN,
      "You must be a member of this project to submit a daily report",
    );
  }

  // 2. Calculation
  const totalWorkers = await prisma.projectMember.count({
    where: {
      projectId: payload.projectId,
      role: ProjectRole.WORKER,
    },
  });

  if (payload.workersPresent > totalWorkers) {
    throw new AppError(
      status.BAD_REQUEST,
      "Present workers cannot be greater than total workers",
    );
  }

  const workersAbsent = Math.max(0, totalWorkers - payload.workersPresent);

  try {
    const result = await prisma.dailySiteReport.create({
      data: {
        ...payload,
        totalWorkers,
        workersAbsent,
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
      throw new AppError(
        status.CONFLICT,
        "A daily report already exists for this project on this date",
      );
    }

    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to submit daily report",
    );
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
    
    const existingReport = await prisma.dailySiteReport.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      throw new AppError(status.NOT_FOUND, "Daily report not found");
    }

    
    const updateData: any = { ...payload };

    
    if (payload.workersPresent !== undefined) {
     
      updateData.workersAbsent = Math.max(
        0, 
        existingReport.totalWorkers - payload.workersPresent
      );
    }

    // Save the changes to the database
    const result = await prisma.dailySiteReport.update({
      where: { id: reportId },
      data: updateData,
    });

    return result;
  } catch (error: any) {
    if (error.code === "P2025") {
      throw new AppError(status.NOT_FOUND, "Daily report not found");
    }

    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to update daily report"
    );
  }
};

export const DailyReportService = {
  createReport,
  getProjectReports,
  updateReport,
};
