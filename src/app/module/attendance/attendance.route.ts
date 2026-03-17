import { Router } from "express";
import { AttendanceController } from "./attendance.controller";

const router = Router();

// Worker clocks in at the start of shift
router.post("/clock-in", AttendanceController.clockIn);

// Worker clocks out at the end of shift
router.patch("/clock-out/:attendanceId", AttendanceController.clockOut);

// Site Manager views everyone who is on-site today
router.get("/project/:projectId/today", AttendanceController.getProjectAttendanceToday);

export const AttendanceRoutes = router;