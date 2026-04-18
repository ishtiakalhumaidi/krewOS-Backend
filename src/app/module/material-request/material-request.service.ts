/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";

const createRequest = async (payload: any) => {
  // Ensure worker is on the project
  const isMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: payload.projectId, userId: payload.requestedBy } }
  });

  if (!isMember) throw new AppError(status.FORBIDDEN, "You must be assigned to this project to request materials");

  return await prisma.materialRequest.create({
    data: {
      projectId: payload.projectId,
      requestedBy: payload.requestedBy,
      itemName: payload.itemName,
      quantity: Number(payload.quantity),
      unit: payload.unit,
      notes: payload.notes,
    }
  });
};

const getMyRequests = async (userId: string, query: Record<string, unknown>) => {
  const requestQuery = new QueryBuilder(prisma.materialRequest, query, {
    searchableFields: ['itemName', 'notes'],
    filterableFields: ['status', 'projectId'],
  })
    .search().filter().where({ requestedBy: userId }).paginate().sort()
    .include({ project: { select: { name: true } } });

  return await requestQuery.execute();
};

const getProjectRequests = async (projectId: string) => {
  return await prisma.materialRequest.findMany({
    where: { projectId },
    include: { requester: { select: { name: true } }, approver: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
};

const updateStatus = async (requestId: string, payload: any) => {
  const dataToUpdate: any = { status: payload.status };
  
  if (payload.approvedBy) dataToUpdate.approvedBy = payload.approvedBy;
  if (payload.deliveryPhotoUrl) dataToUpdate.deliveryPhotoUrl = payload.deliveryPhotoUrl;

  return await prisma.materialRequest.update({
    where: { id: requestId },
    data: dataToUpdate,
  });
};

export const MaterialService = { createRequest, getMyRequests, getProjectRequests, updateStatus };