import { Router } from "express";
import { DailyReportController } from "./daily-report.controller";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createDailyReportSchema,
  updateDailyReportSchema,
} from "./daily-report.validation";
import { checkAuth } from "../../middleware/checkAuth";
import { checkProjectRole } from "../../middleware/checkProjectRole";
import { ProjectRole, UserRole } from "../../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";

const router = Router();

router.post(
  "/",
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  checkProjectRole(ProjectRole.PROJECT_MANAGER, ProjectRole.SITE_MANAGER),
  multerUpload.array("photos", 5), 
  validateRequest(createDailyReportSchema),
  DailyReportController.createReport,
);

router.get(
  "/project/:projectId",
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  checkProjectRole(),
  DailyReportController.getProjectReports,
);

router.patch(
  "/:reportId",
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  checkProjectRole(ProjectRole.PROJECT_MANAGER, ProjectRole.SITE_MANAGER),
  validateRequest(updateDailyReportSchema),
  DailyReportController.updateReport,
);

export const DailyReportRoutes = router;
