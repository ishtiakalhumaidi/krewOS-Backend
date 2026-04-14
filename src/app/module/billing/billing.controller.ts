// src/app/module/billing/billing.controller.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { BillingService } from "./billing.service";
import { stripe } from "../../config/stripe.config";
import { envVars } from "../../config/env";

const createCheckout = catchAsync(async (req: Request, res: Response) => {
  const { priceId } = req.body; 
  const companyId = (req as any).user.companyId;

  const result = await BillingService.createCheckoutSession(companyId, priceId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Checkout session created successfully",
    data: result,
  });
});

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  const webhookSecret = envVars.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error("Missing Stripe signature or webhook secret");
    return res.status(status.BAD_REQUEST).json({ message: "Missing Stripe signature or webhook secret" });
  }

  let event;

  try {
    // req.body MUST be a raw Buffer! Make sure `express.raw({type: 'application/json'})` is used in app.ts for this route
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(status.BAD_REQUEST).json({ message: `Webhook Error: ${err.message}` });
  }

  try {
    // Pass the verified event to the Business Logic Service
    const result = await BillingService.handleStripeWebhookEvent(event);

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Stripe webhook event processed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error processing Stripe webhook event:", error);
    sendResponse(res, {
      statusCode: status.INTERNAL_SERVER_ERROR,
      success: false,
      message: "Error processing Stripe webhook event",
    });
  }
});

export const BillingController = {
  createCheckout,
  handleStripeWebhook,
};