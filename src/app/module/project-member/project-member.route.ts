import { Router } from "express";
import { ProjectMemberController } from "./project-member.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { checkAuth } from "../../middleware/checkAuth";
import { checkProjectRole } from "../../middleware/checkProjectRole";
import { ProjectRole } from "../../../generated/prisma/enums";
import {
  addProjectMemberSchema,
  updateProjectMemberSchema,
} from "./project-members.validation";

const router = Router();

// 🛡️ ONLY Project Managers can add new workers to the site
router.post(
  "/",
  checkAuth(),
  checkProjectRole(ProjectRole.PROJECT_MANAGER),
  validateRequest(addProjectMemberSchema),
  ProjectMemberController.addMember,
);

// 👀 ANY project member can view who else is on the team
router.get(
  "/project/:projectId",
  checkAuth(),
  checkProjectRole(),
  ProjectMemberController.getMembers
);
router.get(
  "/project/:projectId/me",
  checkAuth(),
  ProjectMemberController.getMyRole
);

// 🛡️ ONLY Project Managers can promote/demote a worker's role
router.patch(
  "/project/:projectId/user/:userId/role",
  checkAuth(),
  checkProjectRole(ProjectRole.PROJECT_MANAGER),
  validateRequest(updateProjectMemberSchema),
  ProjectMemberController.updateRole,
);

// 🛡️ ONLY Project Managers can kick someone off the site
router.delete(
  "/project/:projectId/user/:userId",
  checkAuth(),
  checkProjectRole(ProjectRole.PROJECT_MANAGER,ProjectRole.SITE_MANAGER),
  ProjectMemberController.removeMember,
);

export const ProjectMemberRoutes = router;