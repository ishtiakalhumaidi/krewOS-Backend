import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import {
  acceptInviteSchema,
  createCompanyMember,
  createPublicMember,
  loginSchema,
} from "./auth.validation";

const router = Router();

router.post(
  "/register",
  validateRequest(createPublicMember),
  AuthController.registerPublicOwner,
);

router.post("/login", validateRequest(loginSchema), AuthController.loginUser);

router.post(
  "/accept-invite",
  validateRequest(acceptInviteSchema),
  AuthController.registerInvitedMember,
);

router.post(
  "/invite",
  validateRequest(createCompanyMember),
  //   requireAuth,
  //   requireCompanyRole(["OWNER", "ADMIN"]),
  AuthController.sendInvite,
);

export const AuthRoutes = router;
