import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import {
  acceptInviteSchema,
  createCompanyMember,
  createPublicMember,
  loginSchema,
} from "./auth.validation";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/register",
  validateRequest(createPublicMember),
  AuthController.registerPublicOwner,
);

router.post("/refresh-token", AuthController.getNewToken);

router.post("/login", validateRequest(loginSchema), AuthController.loginUser);

router.post(
  "/accept-invite",
  validateRequest(acceptInviteSchema),
  AuthController.registerInvitedMember,
);

router.post(
  "/invite",
  checkAuth(
    UserRole.ADMIN,
    UserRole.OWNER,
    UserRole.SUPER_ADMIN,
  ),
  validateRequest(createCompanyMember),
  //   requireAuth,
  //   requireCompanyRole(["OWNER", "ADMIN"]),
  AuthController.sendInvite,
);
router.post(
  "/change-password",
  checkAuth(
    UserRole.ADMIN,
    UserRole.MEMBER,
    UserRole.OWNER,
    UserRole.SUPER_ADMIN,
  ),
  AuthController.changePassword,
);
router.post(
  "/logout",
  checkAuth(
    UserRole.ADMIN,
    UserRole.MEMBER,
    UserRole.OWNER,
    UserRole.SUPER_ADMIN,
  ),
  AuthController.logoutUser,
);
router.post("/resend-verification", AuthController.resendVerificationCode);
router.post("/verify-email", AuthController.verifyEmail);
router.post("/forget-password", AuthController.forgetPassword);
router.post("/reset-password", AuthController.resetPassword);

//! this is for letter use and learn purpose for any other app use.... we will not allow social login for this platform for security purpose...

router.get("/login/google", AuthController.googleLogin);
router.get("/google/success", AuthController.googleLoginSuccess);
router.get("/oauth/error", AuthController.handleOAuthError);

export const AuthRoutes = router;
