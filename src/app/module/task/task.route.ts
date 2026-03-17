import { Router } from "express";
import { TaskController } from "./task.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createTaskSchema, updateTaskSchema } from "./task.validation";

const router = Router();

router.post("/", validateRequest(createTaskSchema), TaskController.createTask);

router.get(
  "/project/:projectId",

  TaskController.getProjectTasks,
);

router.patch(
  "/:taskId",
  validateRequest(updateTaskSchema),
  TaskController.updateTask,
);

export const TaskRoutes = router;
