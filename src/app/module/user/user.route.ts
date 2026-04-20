import { Router } from "express";
import { UserController } from "./user.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { updateProfileSchema } from "./user.validation";
import { multerUpload } from "../../config/multer.config";

const router = Router();

// 👤 Everyone can view their own profile
router.get(
  "/me",
  checkAuth(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER, UserRole.SUPER_ADMIN),
  UserController.getMyProfile
);

// 👤 Everyone can update their basic info
router.patch(
  "/update-profile",
  checkAuth(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER, UserRole.SUPER_ADMIN),
  validateRequest(updateProfileSchema),
  UserController.updateProfile
);

// 📸 Everyone can upload a profile picture
router.patch(
  "/update-avatar",
  checkAuth(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER, UserRole.SUPER_ADMIN),
  multerUpload.single("avatar"), 
  UserController.updateAvatar
);

export const UserRoutes = router;