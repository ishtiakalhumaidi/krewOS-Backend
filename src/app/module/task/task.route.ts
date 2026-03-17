import { Router } from "express";
import { TaskController } from "./task.controller";

const router = Router();

router.post("/", TaskController.createTask);


router.get("/project/:projectId", TaskController.getProjectTasks);


router.patch("/:taskId", TaskController.updateTask);

export const TaskRoutes = router;