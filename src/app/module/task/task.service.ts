import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import type { ICreateTask, IUpdateTask } from "./task.interface";

const createTask = async (payload: ICreateTask) => {
  const result = await prisma.task.create({
    data: {
      ...payload,
      
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true }
      },
      creator: {
        select: { id: true, name: true }
      }
    }
  });

  return result;
};

const getProjectTasks = async (projectId: string, query: Record<string, unknown>) => {
  const taskQuery = new QueryBuilder(
    prisma.task, 
    query, 
    {
      searchableFields: ['title', 'description'], // Adjust fields based on your schema
      filterableFields: ['status', 'priority', 'assigneeId'], // Allow users to filter tasks
    }
  )
    .search()
    .filter()
    .where({ projectId }) // Must belong to the project
    .paginate()
    .sort()
    .include({
      assignee: {
        select: { id: true, name: true, email: true }
      },
      creator: {
        select: { id: true, name: true }
      }
    });

  return await taskQuery.execute();
};

const updateTask = async (taskId: string, payload: IUpdateTask) => {
  const result = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...payload,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
    },
    include: {
      assignee: {
        select: { name: true, email: true }
      }
    }
  });
  return result;
};
const deleteTask = async (taskId: string) => {
  const result = await prisma.task.delete({
    where: { id: taskId },
  });
  return result;
};

const getMyTasks = async (userId: string, query: Record<string, unknown>) => {

  
  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }
  const taskQuery = new QueryBuilder(
    prisma.task, 
    query, 
    {
      searchableFields: ['title', 'description'], 
      filterableFields: ['status', 'priority', 'projectId'], 
    }
  )
    .search()
    .filter()
    .where({ assignedTo: userId }) 
    .paginate()
    .sort()
    .include({
      project: {
        select: { id: true, name: true, location: true } 
      },
      creator: {
        select: { id: true, name: true }
      }
    });

  return await taskQuery.execute();
};
export const TaskService = {
  createTask,
  getProjectTasks,
  getMyTasks,
  updateTask,
  deleteTask,
};