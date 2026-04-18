import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { checkAuth } from "../../middleware/checkAuth";
import { checkProjectRole } from "../../middleware/checkProjectRole";
import {  UserRole } from "../../../generated/prisma/enums";

import { multerUpload } from "../../config/multer.config";
import { createMaterialSchema, updateMaterialStatusSchema } from "./material-request.validation";
import { MaterialController } from "./material-request.controller";

const router = Router();

router.post(
  "/",
  checkAuth(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER),
  validateRequest(createMaterialSchema),
  MaterialController.createRequest,
);

// 👷 Worker views their own requests
router.get(
  "/my-requests",
  checkAuth(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER),
  MaterialController.getMyRequests,
);

// 👀 Admin/Manager views all requests for a project
router.get(
  "/project/:projectId",
  checkAuth(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER),
  checkProjectRole(),
  MaterialController.getProjectRequests,
);

// 🔄 Update Status (Approve/Reject/Deliver) - Accepts Single Photo upload!
router.patch(
  "/:requestId/status",
  checkAuth(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER),
  multerUpload.single("deliveryPhoto"), // 👉 Expects a single file named "deliveryPhoto"
  // Note: We skip checkProjectRole here so both Admins (Approve) and Workers (Mark Delivered) can use it
  validateRequest(updateMaterialStatusSchema),
  MaterialController.updateStatus,
);

export const MaterialRequestRoutes = router;