import { Router } from "express";
import { CompanyController } from "./company.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";
import { validateRequest } from "../../middleware/validateRequest";
import { updateCompanySchema } from "./company.validation";

const router = Router();

// 🛑 1. SUPER_ADMIN ONLY: View all companies on the platform
router.get(
  "/",
  checkAuth(UserRole.SUPER_ADMIN),
  CompanyController.getAllCompanies,
);

router.get(
  "/company-roster",
  checkAuth(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN),
  CompanyController.getCompanyRoster,
);

// 🛑 2. SUPER_ADMIN ONLY: The Kill Switch (Block/Unblock)
router.patch(
  "/:id/status",
  checkAuth(UserRole.SUPER_ADMIN),
  CompanyController.changeStatus,
);

// 🏢 3. OWNER / ADMIN / SUPER_ADMIN: View specific company details
router.get(
  "/:id",
  checkAuth(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN),
  CompanyController.getCompanyById,
);

// 🏢 4. OWNER / ADMIN / SUPER_ADMIN: Update company details (Name, phone, etc)
router.patch(
  "/:id",
  checkAuth(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN),
  multerUpload.single("file"),
  validateRequest(updateCompanySchema),
  CompanyController.updateCompany,
);

export const CompanyRoutes = router;
