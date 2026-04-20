/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { BillingService } from "./billing.service";
import { stripe } from "../../config/stripe.config";
import { envVars } from "../../config/env";

const createCheckout = catchAsync(async (req: Request, res: Response) => {
  const { plan } = req.body; 
  const companyId = (req as any).user.companyId;
  const userEmail = (req as any).user.email;

  const result = await BillingService.createCheckoutSession(companyId, plan, userEmail);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Checkout session created successfully",
    data: result,
  });
});

const getPlans = catchAsync(async (req: Request, res: Response) => {
  const result = await BillingService.getAvailablePlans();
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Subscription plans retrieved successfully",
    data: result,
  });
});

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {

  const signature = req.headers["stripe-signature"] as string;
  const webhookSecret = envVars.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return res.status(status.BAD_REQUEST).json({ message: "Missing credentials" });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err: any) {
    return res.status(status.BAD_REQUEST).json({ message: `Webhook Error: ${err.message}` });
  }

  try {
    const result = await BillingService.handleStripeWebhookEvent(event);
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Stripe webhook event processed successfully",
      data: result,
    });
  } catch (error) {
    sendResponse(res, {
      statusCode: status.INTERNAL_SERVER_ERROR,
      success: false,
      message: "Error processing Stripe webhook event",
    });
  }
});

const updatePlan = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; 
  const result = await BillingService.updatePlanConfig(id as string, req.body);
  
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Pricing plan updated successfully",
    data: result,
  });
});

const seedPlans = catchAsync(async (req: Request, res: Response) => {
  const result = await BillingService.seedPlanConfigs();
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Plans seeded successfully",
    data: result,
  });
});

export const BillingController = {
  createCheckout,
  getPlans,
  handleStripeWebhook,
  updatePlan,
  seedPlans,
};