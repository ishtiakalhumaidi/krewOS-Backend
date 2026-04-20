
import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import type { IUpdateCompany, IChangeCompanyStatus } from "./company.interface";

const getAllCompanies = async () => {
  const result = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { users: true, projects: true }, 
      },
      subscription: {
        select: { plan: true, status: true }, 
      },
    },
  });
  return result;
};


// 👑 SUPER ADMIN: The "Kill Switch"
const toggleCompanyStatus = async (companyId: string) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });

  if (!company) {
    throw new AppError(status.NOT_FOUND, "Company not found");
  }

  return await prisma.company.update({
    where: { id: companyId },
    data: { isActive: !company.isActive }
  });
};

const getCompanyById = async (id: string) => {
  return await prisma.company.findUnique({
    where: { id },
    include: {
      subscription: true, // So the Owner can see their plan
    }
  });
};
// Add this to a user.service.ts or similar
const getCompanyRoster = async (companyId: string) => {
  return await prisma.user.findMany({
    where: { 
      companyId: companyId,
      isDeleted: false 
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    }
  });
};
const updateCompany = async (id: string, payload: IUpdateCompany) => {
  return await prisma.company.update({
    where: { id },
    data: payload,
  });
};

const changeCompanyStatus = async (
  companyId: string,
  payload: IChangeCompanyStatus,
) => {
  const result = await prisma.company.update({
    where: { id: companyId },
    data: { status: payload.status },
  });
  return result;
};

export const CompanyService = {
  getAllCompanies,
  getCompanyById,
  updateCompany,
  changeCompanyStatus,
  getCompanyRoster, 
  toggleCompanyStatus,
};
