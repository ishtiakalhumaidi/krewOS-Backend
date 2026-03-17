import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.router";
import { ProjectRoutes } from "../module/project/project.router";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/projects", ProjectRoutes);
export const IndexRouter = router;
