import { Router } from "express";
import { AttendanceController } from "./attendance.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { clockInSchema } from "./attendance.validation";

const router = Router();


router.post("/clock-in",validateRequest(clockInSchema), AttendanceController.clockIn);

router.patch("/clock-out/:attendanceId", AttendanceController.clockOut);


router.get(
  "/project/:projectId/today",
  AttendanceController.getProjectAttendanceToday,
);

router.get("/stats/user/:userId", AttendanceController.getWorkerMonthlyStats);

export const AttendanceRoutes = router;
