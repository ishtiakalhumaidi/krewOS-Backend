import { validateRequest } from "./../../middleware/validateRequest";
import { Router } from "express";
import { ProjectController } from "./project.controller";
import { createProjectSchema } from "./project.validation";

const router = Router();

router.post(
  "/",
  validateRequest(createProjectSchema),
  ProjectController.createProject,
);

router.get("/company/:companyId", ProjectController.getCompanyProjects);

export const ProjectRoutes = router;
