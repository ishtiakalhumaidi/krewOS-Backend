/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { UserRole } from "../../../generated/prisma/enums";
import { tokenUtils } from "../../utils/token";

import { envVars } from "../../config/env";
import { sendEmailVersion2 } from "../../shared/sendEmail";

const inviteAdmin = async (
  email: string,
  inviterCompanyId: string | null,
  inviterRole: UserRole,
) => {
  const targetRole =
    inviterRole === UserRole.SUPER_ADMIN
      ? UserRole.SUPER_ADMIN
      : UserRole.ADMIN;

  const token = tokenUtils.getAccessToken({
    email,
    companyId: inviterCompanyId,
    role: targetRole,
  });

  const inviteLink = `${envVars.FRONTEND_URL}/join?token=${token}`;
  let companyName = "KrewOS Platform";

  if (inviterCompanyId) {
    const company = await prisma.company.findUnique({
      where: { id: inviterCompanyId },
    });
    if (company) companyName = company.name;
  }

  await sendEmailVersion2({
    to: email,
    subject: `You are invited to join ${companyName} on KrewOS`,
    templateName: "sendInvite",
    templateData: {
      inviteLink,
      expiresIn: "48 Hours",
      company: companyName,
      role: targetRole,
    },
  });

  return { message: "Admin invite sent successfully", inviteLink };
};

const getAllAdmins = async (companyId: string | null, role: UserRole) => {
  const whereClause: any = { isDeleted: false };

  // Fetch Super Admins if requested by a Super Admin
  if (role === UserRole.SUPER_ADMIN) {
    whereClause.role = UserRole.SUPER_ADMIN;
  }
  // Fetch Company Admins if requested by an Owner
  else {
    whereClause.companyId = companyId;
    whereClause.role = UserRole.ADMIN;
  }

  const admins = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return admins;
};

const softDeleteAdmin = async (
  adminId: string,
  requesterCompanyId: string | null,
  requesterRole: UserRole,
) => {
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin) throw new AppError(status.NOT_FOUND, "Admin not found");

  // 🛡️ SECURITY CHECK: Ensure Owners can only delete admins in their own company
  if (requesterRole !== UserRole.SUPER_ADMIN) {
    if (
      admin.companyId !== requesterCompanyId ||
      admin.role !== UserRole.ADMIN
    ) {
      throw new AppError(
        status.FORBIDDEN,
        "You do not have permission to delete this admin",
      );
    }
  }

  // 🗑️ SOFT DELETE: Update flags instead of deleting the row
  const result = await prisma.user.update({
    where: { id: adminId },
    data: {
      isDeleted: true,
      isActive: false,
      deletedAt: new Date(),
    },
    select: { id: true, name: true, email: true, isDeleted: true },
  });

  return result;
};

export const AdminService = {
  inviteAdmin,
  getAllAdmins,
  softDeleteAdmin,
};
