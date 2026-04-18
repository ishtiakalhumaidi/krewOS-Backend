import { Router } from "express";
import { AttendanceController } from "./attendance.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { clockInSchema } from "./attendance.validation";
import { checkAuth } from "../../middleware/checkAuth";
import { checkProjectRole } from "../../middleware/checkProjectRole";
import { ProjectRole, UserRole } from "../../../generated/prisma/enums";

const router = Router();

// 👷 ANY project member can clock in
router.post(
  "/clock-in",
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  checkProjectRole(),
  validateRequest(clockInSchema),
  AttendanceController.clockIn,
);

// 👷 ANY project member can clock out
router.patch(
  "/clock-out/:attendanceId",
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  // checkProjectRole(),
  AttendanceController.clockOut,
);

router.get(
  "/project/:projectId/my-today",
  checkAuth(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER),
  AttendanceController.getMyTodayAttendance,
);

// 🛡️ ONLY Managers can view the complete list of who is on site today
router.get(
  "/project/:projectId/today",
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  checkProjectRole(ProjectRole.PROJECT_MANAGER, ProjectRole.SITE_MANAGER),
  AttendanceController.getProjectAttendanceToday,
);

// 👤 ANY logged in user can hit this (the Controller verifies they own the stats)
router.get(
  "/stats/user/:userId",
  checkAuth(UserRole.OWNER, UserRole.MEMBER),
  AttendanceController.getWorkerMonthlyStats,
);

router.get(
  "/my-timesheet",
  checkAuth(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER),
  AttendanceController.getMyTimesheet,
);

export const AttendanceRoutes = router;
