import { RequestStatus } from "../../../generated/prisma/enums";

export interface ICreateMaterialRequest {
  projectId: string;
  requestedBy: string;
  itemName: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface IUpdateMaterialRequestStatus {
  projectId: string;
  status: RequestStatus;
  approvedBy?: string;
  notes?: string;
  deliveryPhotoUrl?: string;
}
