import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { DashboardController } from "./dashboard.controller";

const router = Router();

router.get(
  "/stats",
  checkAuth(
    UserRole.SUPER_ADMIN,
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.MEMBER,
  ),
  DashboardController.getDashboardStats,
);

export const DashboardRoutes = router;
