import { Router } from "express";
import { SafetyChecklistController } from "./safety-checklist.controller";

const router = Router();


router.post("/", SafetyChecklistController.createChecklist);


router.get("/project/:projectId", SafetyChecklistController.getProjectChecklists);

export const SafetyChecklistRoutes = router;