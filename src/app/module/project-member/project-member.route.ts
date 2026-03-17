import { Router } from "express";
import { ProjectMemberController } from "./project-member.controller";

const router = Router();

router.post("/", ProjectMemberController.addMember);

router.get("/project/:projectId", ProjectMemberController.getMembers);

router.patch(
  "/project/:projectId/user/:userId/role",
  ProjectMemberController.updateRole,
);

router.delete(
  "/project/:projectId/user/:userId",
  ProjectMemberController.removeMember,
);

export const ProjectMemberRoutes = router;
