import { prisma } from "../../lib/prisma";
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

const getProjectTasks = async (projectId: string) => {
  const result = await prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
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

export const TaskService = {
  createTask,
  getProjectTasks,
  updateTask,
};