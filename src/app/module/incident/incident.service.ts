import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import type {
  ICreateIncident,
  IUpdateIncidentStatus,
} from "./incident.interface";

const createIncident = async (payload: ICreateIncident) => {
  // Ensure the user is actually part of the project
  const isMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: payload.projectId,
        userId: payload.reportedBy,
      },
    },
  });

  if (!isMember) {
    throw new AppError(
      status.FORBIDDEN,
      "You must be assigned to this project to report an incident",
    );
  }

  const result = await prisma.incident.create({
    data: {
      projectId: payload.projectId,
      reportedBy: payload.reportedBy,
      title: payload.title,
      description: payload.description,
      severity: payload.severity,
      occurredAt: new Date(payload.dateOccurred),
      photoUrls: payload.photoUrls || [],
    },
    include: {
      reporter: { select: { name: true, email: true } },
    },
  });

  return result;
};

const getProjectIncidents = async (projectId: string) => {
  const result = await prisma.incident.findMany({
    where: { projectId },
    include: {
      reporter: { select: { name: true } },
    },
    orderBy: { occurredAt: "desc" },
  });
  return result;
};

const resolveIncident = async (
  incidentId: string,
  payload: IUpdateIncidentStatus,
) => {
  const result = await prisma.incident.update({
    where: { id: incidentId },
    data: {
      isResolved: payload.isResolved,
      resolutionNotes: payload.resolutionNotes,
    },
  });

  return result;
};

export const IncidentService = {
  createIncident,
  getProjectIncidents,
  resolveIncident,
};
