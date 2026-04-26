import { Router } from "express";
import { ProjectController } from "./project.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { createProjectSchema, ProjectValidation } from "./project.validation";

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
  "/",
  checkAuth(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER),
  ProjectController.getCompanyProjects,
);
// 👷 ANY project member can view the sites they are specifically assigned to
router.get(
  "/my-assignments",
  checkAuth(UserRole.MEMBER, UserRole.ADMIN, UserRole.OWNER),
  ProjectController.getMyProjects,
);
router.get(
  "/:projectId",
  checkAuth(UserRole.ADMIN, UserRole.OWNER, UserRole.MEMBER),
  ProjectController.getProjectById,
);

router.patch(
  "/:projectId",
  checkAuth(UserRole.ADMIN, UserRole.OWNER),
  validateRequest(ProjectValidation.updateProjectSchema),
  ProjectController.updateProject,
);
export const ProjectRoutes = router;
