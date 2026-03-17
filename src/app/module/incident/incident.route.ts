import { Router } from "express";
import { IncidentController } from "./incident.controller";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createIncidentSchema,
  updateIncidentStatusSchema,
} from "./incident.validation";

const router = Router();

router.post(
  "/",
  validateRequest(createIncidentSchema),
  IncidentController.createIncident,
);

router.get("/project/:projectId", IncidentController.getProjectIncidents);

router.patch(
  "/:incidentId/resolve",
  validateRequest(updateIncidentStatusSchema),
  IncidentController.resolveIncident,
);

export const IncidentRoutes = router;
