import { Router } from "express";
import { AdminController } from "./admin.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { inviteAdminSchema } from "./admin.validation";

const router = Router();

// 🛡️ ONLY Owners & Super Admins can access these routes
router.post(
  "/invite",
  checkAuth(UserRole.OWNER, UserRole.SUPER_ADMIN),
  validateRequest(inviteAdminSchema),
  AdminController.inviteAdmin
);

router.get(
  "/",
  checkAuth(UserRole.OWNER, UserRole.SUPER_ADMIN),
  AdminController.getAllAdmins
);

router.delete(
  "/:adminId",
  checkAuth(UserRole.OWNER, UserRole.SUPER_ADMIN),
  AdminController.softDeleteAdmin
);

export const AdminRoutes = router;