import { validateRequest } from "./../../middleware/validateRequest";
import { Router } from "express";
import { SafetyChecklistController } from "./safety-checklist.controller";
import { createSafetyChecklistSchema } from "./safety-checklist.validation";

const router = Router();

router.post(
  "/",
  validateRequest(createSafetyChecklistSchema),
  SafetyChecklistController.createChecklist,
);

router.get(
  "/project/:projectId",
  SafetyChecklistController.getProjectChecklists,
);

export const SafetyChecklistRoutes = router;
