import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import type { ICreateSafetyChecklist } from "./safety-checklist.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";

const createChecklist = async (payload: ICreateSafetyChecklist) => {
  // 1. Verify the worker is on the project
  const isMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: payload.projectId,
        userId: payload.submittedBy,
      }
    }
  });

  if (!isMember) {
     throw new AppError(
      status.FORBIDDEN,"You must be assigned to this project to submit a safety checklist");
  }

  // 2. Create the checklist
  const result = await prisma.safetyChecklist.create({
    data: {
      projectId: payload.projectId,
      submittedBy: payload.submittedBy,
      checkDate: new Date(payload.checkDate),
      checklistData: payload.checklistData, 
      allClear: payload.allClear,
      notes: payload.notes,
    },
    include: {
      submitter: { select: { name: true, email: true } }
    }
  });

  return result;
};

const getProjectChecklists = async (projectId: string) => {
  const result = await prisma.safetyChecklist.findMany({
    where: { projectId },
    include: {
      submitter: { select: { name: true } }
    },
    orderBy: { checkDate: 'desc' }
  });
  return result;
};
const getCompanyChecklists = async (companyId: string, query: Record<string, unknown>) => {
  const checklistQuery = new QueryBuilder(
    prisma.safetyChecklist, 
    query, 
    {
      searchableFields: ['notes', 'project.name', 'submitter.name'],
      filterableFields: ['allClear', 'projectId', 'checkDate', "createdAt"],
    }
  )
    .search()
    .filter()
    .where({ project: { companyId: companyId } }) 
    .paginate()
    .sort()
    .include({
      project: { select: { id: true, name: true } },
      submitter: { select: { id: true, name: true, email: true } }
    });

  return await checklistQuery.execute();
};
export const SafetyChecklistService = {
  createChecklist,
  getProjectChecklists,
  getCompanyChecklists
};