import { prisma } from "../../lib/prisma";
import status from "http-status";
import type { IUpdateCompany, IChangeCompanyStatus } from "./company.interface";
import AppError from "../../errorHelpers/AppError";

const getAllCompanies = async () => {
  const result = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { users: true, projects: true }, // Tells you how big the client is!
      },
      subscription: {
        select: { plan: true, status: true }, // Tells you if they are paying!
      },
    },
  });
  return result;
};

const getCompanyById = async (companyId: string) => {
  const result = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      subscription: true,
      _count: { select: { users: true, projects: true } },
    },
  });

  if (!result) throw new AppError(status.NOT_FOUND, "Company not found");
  return result;
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
const updateCompany = async (companyId: string, payload: IUpdateCompany) => {
  const result = await prisma.company.update({
    where: { id: companyId },
    data: payload,
  });
  return result;
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
};
