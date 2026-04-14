import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { BillingController } from "./billing.controller";

const router = Router();

// Route to create a checkout session (Standard JSON route)
router.post(
  "/create-checkout-session",
  checkAuth(UserRole.OWNER, UserRole.ADMIN),
  BillingController.createCheckout
);

export const BillingRoutes = router;