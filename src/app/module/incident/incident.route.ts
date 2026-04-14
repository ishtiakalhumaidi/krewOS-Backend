import { Router } from "express";
import { IncidentController } from "./incident.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { checkAuth } from "../../middleware/checkAuth";
import { checkProjectRole } from "../../middleware/checkProjectRole";
import { ProjectRole, UserRole } from "../../../generated/prisma/enums";
import {
  createIncidentSchema,
  updateIncidentStatusSchema,
} from "./incident.validation";
import { multerUpload } from "../../config/multer.config";

const router = Router();

// 👷 ANY project member can report a safety issue
router.post(
  "/",
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  checkProjectRole(),
  validateRequest(createIncidentSchema),
  IncidentController.createIncident,
);

// 👀 ANY project member can view the safety log
router.get(
  "/project/:projectId",
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  checkProjectRole(),
  IncidentController.getProjectIncidents,
);

// 🛡️ ONLY Managers & Safety Officers can resolve an incident
router.patch(
  "/:incidentId/resolve",
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  checkProjectRole(
    ProjectRole.PROJECT_MANAGER,
    ProjectRole.SITE_MANAGER,
    ProjectRole.SAFETY_OFFICER,
  ),
  multerUpload.array("photos", 5),
  validateRequest(updateIncidentStatusSchema),
  IncidentController.resolveIncident,
);

export const IncidentRoutes = router;
