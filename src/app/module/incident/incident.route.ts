import { Router } from "express";
import { IncidentController } from "./incident.controller";

const router = Router();

// Report a new hazard or accident
router.post("/", IncidentController.createIncident);

// View all safety issues for a specific site
router.get("/project/:projectId", IncidentController.getProjectIncidents);

// Mark an issue as resolved (e.g., scaffolding repaired)
router.patch("/:incidentId/resolve", IncidentController.resolveIncident);

export const IncidentRoutes = router;