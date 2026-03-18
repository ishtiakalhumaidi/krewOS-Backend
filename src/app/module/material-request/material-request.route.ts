import { Router } from "express";
import { MaterialRequestController } from "./material-request.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { checkAuth } from "../../middleware/checkAuth";
import { checkProjectRole } from "../../middleware/checkProjectRole";
import { ProjectRole, UserRole } from "../../../generated/prisma/enums";
import {
  createMaterialRequestSchema,
  updateMaterialRequestStatusSchema,
} from "./material-request.validation";

const router = Router();

// 👷 ANY project member can request materials
router.post(
  "/",
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  checkProjectRole(),
  validateRequest(createMaterialRequestSchema),
  MaterialRequestController.createRequest,
);

// 👀 ANY project member can view the material requests
router.get(
  "/project/:projectId", 
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  checkProjectRole(),
  MaterialRequestController.getProjectRequests
);

// 🛡️ ONLY Managers can approve, reject, or mark materials as delivered
router.patch(
  "/:requestId/status",
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  checkProjectRole(ProjectRole.PROJECT_MANAGER, ProjectRole.SITE_MANAGER),
  validateRequest(updateMaterialRequestStatusSchema),
  MaterialRequestController.updateStatus,
);

export const MaterialRequestRoutes = router;