import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.router";
import { ProjectRoutes } from "../module/project/project.router";
import { TaskRoutes } from "../module/task/task.route";
import { ProjectMemberRoutes } from "../module/project-member/project-member.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/projects", ProjectRoutes);
router.use("/tasks", TaskRoutes);
router.use("/project-members", ProjectMemberRoutes);

export const IndexRouter = router;
