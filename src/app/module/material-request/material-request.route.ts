import { Router } from "express";
import { MaterialRequestController } from "./material-request.controller";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createMaterialRequestSchema,
  updateMaterialRequestStatusSchema,
} from "./material-request.validation";

const router = Router();

router.post(
  "/",
  validateRequest(createMaterialRequestSchema),
  MaterialRequestController.createRequest,
);

router.get("/project/:projectId", MaterialRequestController.getProjectRequests);

router.patch(
  "/:requestId/status",
  validateRequest(updateMaterialRequestStatusSchema),
  MaterialRequestController.updateStatus,
);

export const MaterialRequestRoutes = router;
