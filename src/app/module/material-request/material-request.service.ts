import { prisma } from "../../lib/prisma";
import type {
  ICreateMaterialRequest,
  IUpdateMaterialRequestStatus,
} from "./material-request.interface";

const createRequest = async (payload: ICreateMaterialRequest) => {
  // Ensure the worker is on the project
  const isMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: payload.projectId,
        userId: payload.requestedBy,
      },
    },
  });

  if (!isMember) {
    throw new Error(
      "You must be assigned to this project to request materials",
    );
  }

  // Create the request
  const result = await prisma.materialRequest.create({
    data: {
      projectId: payload.projectId,
      requestedBy: payload.requestedBy,
      itemName: payload.itemName,
      quantity: payload.quantity,
      unit: payload.unit,
      notes: payload.notes,
    },
    include: {
      requester: { select: { name: true, email: true } },
    },
  });

  return result;
};

const getProjectRequests = async (projectId: string) => {
  const result = await prisma.materialRequest.findMany({
    where: { projectId },
    include: {
      requester: true,
      approver: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return result;
};

const updateRequestStatus = async (
  requestId: string,
  payload: IUpdateMaterialRequestStatus,
) => {
  const result = await prisma.materialRequest.update({
    where: { id: requestId },
    data: {
      status: payload.status,
      approvedBy: payload.approvedBy,
      notes: payload.notes,
      deliveryPhotoUrl: payload.deliveryPhotoUrl,
    },
    include: {
      approver: { select: { name: true } },
    },
  });

  return result;
};

export const MaterialRequestService = {
  createRequest,
  getProjectRequests,
  updateRequestStatus,
};
