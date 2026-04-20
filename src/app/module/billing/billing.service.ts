/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { stripe } from "../../config/stripe.config";
import { prisma } from "../../lib/prisma";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import {
  SubscriptionStatus,
  PaymentStatus,
  SubscriptionPlan,
} from "../../../generated/prisma/enums";

// ---------------------------------------------------------------------------
// 1. CREATE CHECKOUT SESSION
// ---------------------------------------------------------------------------
const createCheckoutSession = async (
  companyId: string,
  plan: SubscriptionPlan,
  userEmail: string,
) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscription: true },
  });

  const planConfig = await prisma.planConfig.findUnique({
    where: { tier: plan },
  });

  if (!planConfig) throw new AppError(status.NOT_FOUND, "Plan not found");
  if (!company) throw new AppError(status.NOT_FOUND, "Company not found");

  let customerId = company.subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: company.name,
      email: userEmail,
      metadata: { companyId: company.id },
    });
    customerId = customer.id;

    await prisma.subscription.upsert({
      where: { companyId },
      update: { stripeCustomerId: customerId },
      create: { companyId, stripeCustomerId: customerId },
    });
  } else {
    // Force update the existing customer's email in Stripe for reliable pre-filling
    await stripe.customers.update(customerId, { email: userEmail });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: planConfig.name,
            description: planConfig.description,
          },
          unit_amount: planConfig.price * 100,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    success_url: `${envVars.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${envVars.FRONTEND_URL}/admin/settings/billing?canceled=true`,
    metadata: {
      companyId: companyId,
      planTier: planConfig.tier,
      planConfigId: planConfig.id,
    },
  });

  return { url: session.url };
};

// ---------------------------------------------------------------------------
// 2. HANDLE STRIPE WEBHOOK
// ---------------------------------------------------------------------------
const handleStripeWebhookEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const companyId = session.metadata?.companyId;
      const planTier = session.metadata?.planTier as SubscriptionPlan;
      const planConfigId = session.metadata?.planConfigId;

      if (!companyId || !planTier) {
        console.error("Missing companyId or planTier in session metadata");
        return { message: "Missing metadata" };
      }

      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: { subscription: true },
      });

      if (!company || !company.subscription) {
        console.error(`Company or Subscription not found for ID: ${companyId}`);
        return { message: "Company/Subscription not found" };
      }

      await prisma.$transaction(async (tx) => {
        // 1. Update Subscription
        await tx.subscription.update({
          where: { companyId: companyId },
          data: {
            stripeSubscriptionId: session.subscription as string,
            status: SubscriptionStatus.ACTIVE,
            plan: planTier,
            planConfigId: planConfigId,
          },
        });

        // 2. Update Company
        await tx.company.update({
          where: { id: companyId },
          data: { plan: planTier },
        });

        // 🌟 3. INSTANTLY SAVE THE FIRST PAYMENT HERE!
        if (session.payment_status === "paid") {
          // Stripe checkout sessions have either a payment_intent or an invoice attached
          const paymentId = (session.payment_intent as string) || (session.invoice as string) || session.id;

          const existingPayment = await tx.payment.findUnique({
            where: { stripePaymentId: paymentId },
          });

          if (!existingPayment) {
            await tx.payment.create({
              data: {
                companyId: companyId,
                stripePaymentId: paymentId,
                amountCents: session.amount_total || 0,
                currency: session.currency || "usd",
                status: PaymentStatus.SUCCEEDED,
                paidAt: new Date(),
              },
            });
            console.log(`💵 ✅ Initial payment instantly recorded for Company: ${companyId}`);
          }
        }
      });

      console.log(`✅ Processed checkout.session.completed for company ${companyId}`);
      break;
    }

    case "invoice.paid":
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as any;

      // Safe fallback: If payment_intent is null, use the invoice.id.
      const paymentIntentId = invoice.payment_intent || invoice.id;
      const subscriptionId = invoice.subscription as string;
      const customerId = invoice.customer as string;

      // Idempotency guard — don't double-record the same payment
      const existingPayment = await prisma.payment.findUnique({
        where: { stripePaymentId: paymentIntentId },
      });

      if (existingPayment) {
        console.log(
          `⏭️  Payment ${paymentIntentId} already recorded, skipping`,
        );
        return { message: "Already processed" };
      }

      // Look up by Customer ID to bypass the Stripe race condition
      const companySub = await prisma.subscription.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (companySub) {
        const stripeSub = (await stripe.subscriptions.retrieve(
          subscriptionId,
        )) as any;

        await prisma.$transaction(async (tx) => {
          await tx.subscription.update({
            where: { id: companySub.id },
            data: {
              stripeSubscriptionId: subscriptionId,
              currentPeriodStart: new Date(
                stripeSub.current_period_start * 1000,
              ),
              currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            },
          });

          // 💰 Record the revenue
          await tx.payment.create({
            data: {
              companyId: companySub.companyId,
              stripePaymentId: paymentIntentId,
              amountCents: invoice.amount_paid,
              currency: invoice.currency,
              status: PaymentStatus.SUCCEEDED,
              paidAt: invoice.status_transitions?.paid_at
                ? new Date(invoice.status_transitions.paid_at * 1000)
                : new Date(),
            },
          });
        });

        console.log(
          `💵 ✅ Payment receipt created for Company: ${companySub.companyId}`,
        );
      } else {
        console.error(
          `❌ Could not find company for Stripe Customer ${customerId}`,
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      const freePlanConfig = await prisma.planConfig.findUnique({
        where: { tier: SubscriptionPlan.FREE },
      });

      const companySub = await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: SubscriptionStatus.CANCELED,
          plan: SubscriptionPlan.FREE,
          planConfigId: freePlanConfig?.id,
        },
      });

      await prisma.company.update({
        where: { id: companySub.companyId },
        data: { plan: SubscriptionPlan.FREE },
      });

      console.log(
        `🛑 Processed customer.subscription.deleted for ${subscription.id}`,
      );
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return { message: `Webhook Event ${event.id} processed successfully` };
};

const getAvailablePlans = async () => {
  return await prisma.planConfig.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
};

const seedPlanConfigs = async () => {
  const plans = [
    {
      tier: SubscriptionPlan.FREE,
      name: "FREE TIER",
      price: 0,
      interval: "forever",
      description: "Essential tools to get your construction team started.",
      features: [
        "Up to 5 Team Members",
        "1 Active Project",
        "Basic Safety Reports",
      ],
      maxProjects: 1,
      maxMembers: 5,
      maxStorage: 100,
    },
    {
      tier: SubscriptionPlan.PRO,
      name: "PRO TIER",
      price: 49,
      interval: "per month",
      description: "Perfect for growing construction teams and multiple sites.",
      features: [
        "Up to 50 Team Members",
        "10 Active Projects",
        "Advanced Reporting",
        "Material Tracking",
      ],
      maxProjects: 10,
      maxMembers: 50,
      maxStorage: 5000,
    },
    {
      tier: SubscriptionPlan.ENTERPRISE,
      name: "ENTERPRISE",
      price: 199,
      interval: "per month",
      description: "For large-scale operations requiring maximum limits.",
      features: [
        "Unlimited Team Members",
        "Unlimited Projects",
        "Custom API Access",
        "Dedicated Support Manager",
      ],
      maxProjects: 999999,
      maxMembers: 999999,
      maxStorage: 999999,
    },
  ];

  for (const plan of plans) {
    await prisma.planConfig.upsert({
      where: { tier: plan.tier },
      update: plan,
      create: plan,
    });
  }

  return { message: "Database seeded with pricing plans!" };
};

const updatePlanConfig = async (planId: string, payload: any) => {
  return await prisma.planConfig.update({
    where: { id: planId },
    data: payload,
  });
};

export const BillingService = {
  createCheckoutSession,
  handleStripeWebhookEvent,
  getAvailablePlans,
  seedPlanConfigs,
  updatePlanConfig,
};
