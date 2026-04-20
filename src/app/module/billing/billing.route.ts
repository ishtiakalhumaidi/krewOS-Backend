import express, { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { BillingController } from "./billing.controller";

const router = Router();
router.get(
  "/plans",
  checkAuth(UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  BillingController.getPlans
);
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  BillingController.handleStripeWebhook
);
router.post(
  "/seed",
  checkAuth(UserRole.SUPER_ADMIN),
  BillingController.seedPlans
);
// Route to create a checkout session (Standard JSON route)
router.post(
  "/create-checkout-session",
  checkAuth(UserRole.OWNER, UserRole.ADMIN),
  BillingController.createCheckout
);
// 👑 SUPER ADMIN ONLY: Update plan prices and limits
router.patch(
  "/plans/:id",
  checkAuth(UserRole.SUPER_ADMIN),
  BillingController.updatePlan
);
export const BillingRoutes = router;