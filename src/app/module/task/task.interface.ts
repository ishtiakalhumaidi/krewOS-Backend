import { TaskStatus, TaskPriority } from "../../../generated/prisma/enums";

export interface ICreateTask {
  projectId: string;
  createdBy: string;
  assignedTo?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | Date;
}

export interface IUpdateTask {
  projectId: string;
  title?: string;
  description?: string;
  assignedTo?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | Date;
}
