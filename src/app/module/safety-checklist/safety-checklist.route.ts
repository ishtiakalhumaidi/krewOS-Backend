import { Router } from "express";
import { SafetyChecklistController } from "./safety-checklist.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { checkAuth } from "../../middleware/checkAuth";
import { checkProjectRole } from "../../middleware/checkProjectRole";
import { ProjectRole, UserRole } from "../../../generated/prisma/enums";
import { createSafetyChecklistSchema } from "./safety-checklist.validation";

const router = Router();
router.get(
  "/",
  checkAuth(UserRole.OWNER, UserRole.ADMIN),
  SafetyChecklistController.getCompanyChecklists
);  
// 🛡️ ONLY Safety Officers and Managers can submit checklists
router.post(
  "/",
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  checkProjectRole(
    ProjectRole.SAFETY_OFFICER,
    ProjectRole.SITE_MANAGER,
    ProjectRole.PROJECT_MANAGER,
  ),
  validateRequest(createSafetyChecklistSchema),
  SafetyChecklistController.createChecklist,
);

// 👀 ANY project member can view the safety checklists
router.get(
  "/project/:projectId",
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  checkProjectRole(),
  SafetyChecklistController.getProjectChecklists,
);

export const SafetyChecklistRoutes = router;
