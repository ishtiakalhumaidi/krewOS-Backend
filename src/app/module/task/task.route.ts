import { Router } from "express";
import { TaskController } from "./task.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { checkAuth } from "../../middleware/checkAuth";
import { checkProjectRole } from "../../middleware/checkProjectRole";
import { ProjectRole, UserRole } from "../../../generated/prisma/enums";
import { createTaskSchema, updateTaskSchema } from "./task.validation";

const router = Router();

// 🛡️ ONLY Managers can create new tasks and assign them
router.post(
  "/",
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  checkProjectRole(ProjectRole.PROJECT_MANAGER, ProjectRole.SITE_MANAGER),
  validateRequest(createTaskSchema),
  TaskController.createTask,
);

// 👀 ANY project member can view the task board
router.get(
  "/project/:projectId",
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  checkProjectRole(), 
  TaskController.getProjectTasks,
);

// 👷 ANY project member can update a task (e.g., mark as IN_PROGRESS or DONE)
router.patch(
  "/:taskId",
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  checkProjectRole(), 
  validateRequest(updateTaskSchema),
  TaskController.updateTask,
);

export const TaskRoutes = router;
