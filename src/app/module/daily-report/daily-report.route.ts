import { Router } from "express";
import { DailyReportController } from "./daily-report.controller";

const router = Router();


router.post("/", DailyReportController.createReport);


router.get("/project/:projectId", DailyReportController.getProjectReports);


router.patch("/:reportId", DailyReportController.updateReport);

export const DailyReportRoutes = router;