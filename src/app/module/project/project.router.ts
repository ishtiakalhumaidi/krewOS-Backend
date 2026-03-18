import { Router } from "express";
import { ProjectController } from "./project.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { createProjectSchema } from "./project.validation";

const router = Router();

// 🏢 ONLY Company Owners and Admins can create new projects
router.post(
  "/",
  checkAuth(UserRole.OWNER, UserRole.ADMIN),
  validateRequest(createProjectSchema),
  ProjectController.createProject,
);

// 👷 ANY authenticated company member can view the list of projects
router.get(
  "/company/:companyId",
  checkAuth(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER),
  ProjectController.getCompanyProjects
);

export const ProjectRoutes = router;