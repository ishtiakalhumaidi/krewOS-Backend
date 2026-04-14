import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.router";
import { ProjectRoutes } from "../module/project/project.router";
import { TaskRoutes } from "../module/task/task.route";
import { ProjectMemberRoutes } from "../module/project-member/project-member.route";
import { DailyReportRoutes } from "../module/daily-report/daily-report.route";
import { AttendanceRoutes } from "../module/attendance/attendance.route";
import { MaterialRequestRoutes } from "../module/material-request/material-request.route";
import { IncidentRoutes } from "../module/incident/incident.route";
import { SafetyChecklistRoutes } from "../module/safety-checklist/safety-checklist.route";
import { CompanyRoutes } from "../module/company/company.route";
import { AdminRoutes } from "../module/admin/admin.route";
import { BillingRoutes } from "../module/billing/billing.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/companies", CompanyRoutes);
router.use("/projects", ProjectRoutes);
router.use("/tasks", TaskRoutes);
router.use("/project-members", ProjectMemberRoutes);
router.use("/daily-reports", DailyReportRoutes);
router.use("/attendance", AttendanceRoutes);
router.use("/material-requests", MaterialRequestRoutes);
router.use("/incidents", IncidentRoutes);
router.use("/safety-checklists", SafetyChecklistRoutes);
router.use("/admin", AdminRoutes);
router.use("/billing", BillingRoutes);

export const IndexRouter = router;
