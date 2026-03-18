/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AdminService } from "./admin.service";
import AppError from "../../errorHelpers/AppError";

const inviteAdmin = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const { companyId, role } = (req as any).user;

  const result = await AdminService.inviteAdmin(email, companyId, role);
  
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admin invitation sent",
    data: result,
  });
});

const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
  const { companyId, role } = (req as any).user;
  const result = await AdminService.getAllAdmins(companyId, role);
  
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admins retrieved successfully",
    data: result,
  });
});

const softDeleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const { adminId } = req.params;
  const { userId, companyId, role } = (req as any).user;

  // 🛡️ SECURITY: Prevent an admin from deleting themselves!
  if (adminId === userId) {
    throw new AppError(status.BAD_REQUEST, "You cannot delete your own account");
  }

  const result = await AdminService.softDeleteAdmin(adminId as string, companyId, role);
  
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admin successfully removed (Soft Deleted)",
    data: result,
  });
});

export const AdminController = {
  inviteAdmin,
  getAllAdmins,
  softDeleteAdmin,
};