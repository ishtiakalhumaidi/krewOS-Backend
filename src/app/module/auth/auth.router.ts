import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router();

router.post("/register", AuthController.registerPublicOwner);

router.post("/login", AuthController.loginUser);

router.post("/accept-invite", AuthController.registerInvitedMember);

router.post(
  "/invite",
  //   requireAuth,
  //   requireCompanyRole(["OWNER", "ADMIN"]),
  AuthController.sendInvite,
);

export const AuthRoutes = router;
