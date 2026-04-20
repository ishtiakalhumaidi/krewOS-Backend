import { Router } from "express";
import { CompanyController } from "./company.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";
import { validateRequest } from "../../middleware/validateRequest";
import { updateCompanySchema } from "./company.validation";

const router = Router();

router.get(
  "/all",
  checkAuth(UserRole.SUPER_ADMIN),
  CompanyController.getAllCompanies,
);
router.patch(
  "/:id/toggle-status",
  checkAuth(UserRole.SUPER_ADMIN),
  CompanyController.toggleCompanyStatus
);
router.get(
  "/company-roster",
  checkAuth(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN),
  CompanyController.getCompanyRoster,
);
router.get(
  "/settings",
  checkAuth(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER,UserRole.SUPER_ADMIN),
  CompanyController.getCompanyById 
);

// Update the LOGGED-IN user's company
router.patch(
  "/update",
  checkAuth(UserRole.OWNER, UserRole.ADMIN),
  multerUpload.single("logo"), // Changed from "file" to "logo" for clarity
  validateRequest(updateCompanySchema),
  CompanyController.updateCompany 
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
