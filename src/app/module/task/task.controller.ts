/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { TaskService } from "./task.service";

const createTask = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  payload.createdBy = (req as any).user.userId;
  const result = await TaskService.createTask(payload);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Task created successfully",
    data: result,
  });
});

const getProjectTasks = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  
  
  const result = await TaskService.getProjectTasks(projectId as string, req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Tasks retrieved successfully",
    meta: result.meta, 
    data: result.data,
  });
});

const updateTask = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const payload = req.body;
  const result = await TaskService.updateTask(taskId as string, payload);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Task updated successfully",
    data: result,
  });
});

const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const result = await TaskService.deleteTask(taskId as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Task deleted successfully",
    data: result,
  });
});

const getMyTasks = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId; 
  
  const result = await TaskService.getMyTasks(userId as string, req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Your tasks retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});
export const TaskController = {
  createTask,
  getProjectTasks,
  getMyTasks,
  updateTask,
  deleteTask, 
};