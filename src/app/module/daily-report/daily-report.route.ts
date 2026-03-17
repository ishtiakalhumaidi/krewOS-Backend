import { Router } from "express";
import { DailyReportController } from "./daily-report.controller";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createDailyReportSchema,
  updateDailyReportSchema,
} from "./daily-report.validation";

const router = Router();

router.post(
  "/",
  validateRequest(createDailyReportSchema),
  DailyReportController.createReport,
);

router.get("/project/:projectId", DailyReportController.getProjectReports);

router.patch(
  "/:reportId",
  validateRequest(updateDailyReportSchema),
  DailyReportController.updateReport,
);

export const DailyReportRoutes = router;
