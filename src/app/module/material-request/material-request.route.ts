import { Router } from "express";
import { MaterialRequestController } from "./material-request.controller";

const router = Router();

router.post("/", MaterialRequestController.createRequest);


router.get("/project/:projectId", MaterialRequestController.getProjectRequests);


router.patch("/:requestId/status", MaterialRequestController.updateStatus);

export const MaterialRequestRoutes = router;