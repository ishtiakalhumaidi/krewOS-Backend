import { Router } from "express";
import { ProjectMemberController } from "./project-member.controller";
import { validateRequest } from "../../middleware/validateRequest";
import {
  addProjectMemberSchema,
  updateProjectMemberSchema,
} from "./project-members.validation";

const router = Router();

router.post(
  "/",
  validateRequest(addProjectMemberSchema),
  ProjectMemberController.addMember,
);

router.get("/project/:projectId", ProjectMemberController.getMembers);

router.patch(
  "/project/:projectId/user/:userId/role",
  validateRequest(updateProjectMemberSchema),
  ProjectMemberController.updateRole,
);

router.delete(
  "/project/:projectId/user/:userId",
  ProjectMemberController.removeMember,
);

export const ProjectMemberRoutes = router;
