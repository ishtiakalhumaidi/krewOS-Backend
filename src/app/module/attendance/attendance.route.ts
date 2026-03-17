import { Router } from "express";
import { AttendanceController } from "./attendance.controller";

const router = Router();


router.post("/clock-in", AttendanceController.clockIn);

router.patch("/clock-out/:attendanceId", AttendanceController.clockOut);


router.get(
  "/project/:projectId/today",
  AttendanceController.getProjectAttendanceToday,
);

router.get("/stats/user/:userId", AttendanceController.getWorkerMonthlyStats);

export const AttendanceRoutes = router;
