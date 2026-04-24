/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { QueryBuilder } from "../../utils/QueryBuilder";

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
    client_reference_id: companyId,
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

      const companyId =
        session.metadata?.companyId || session.client_reference_id;
      const planTier = session.metadata?.planTier as SubscriptionPlan;
      const planConfigId = session.metadata?.planConfigId;

      if (!companyId || !planTier) return { message: "Missing metadata" };

      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: { subscription: true },
      });

      if (!company || !company.subscription)
        return { message: "Company/Subscription not found" };

      const newSubscriptionId = session.subscription as string;
      const oldSubscriptionId = company.subscription.stripeSubscriptionId;
      let startDate = new Date();
      let endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      if (newSubscriptionId) {
        try {
          const stripeSub = (await stripe.subscriptions.retrieve(
            newSubscriptionId,
          )) as any;
          if (stripeSub && stripeSub.current_period_start) {
            startDate = new Date(stripeSub.current_period_start * 1000);
            endDate = new Date(stripeSub.current_period_end * 1000);
          }
        } catch (err) {
          console.log(
            "⚠️ Could not fetch Stripe dates, using standard 30-day fallback.",
          );
        }
      }

      // 🌟 FIX 1: Removed transactions to prevent Postgres Deadlocks
      await prisma.subscription.update({
        where: { companyId: companyId },
        data: {
          stripeSubscriptionId: newSubscriptionId,
          status: SubscriptionStatus.ACTIVE,
          plan: planTier,
          planConfigId: planConfigId,
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
          cancelAtPeriodEnd: false,
        },
      });

      await prisma.company.update({
        where: { id: companyId },
        data: { plan: planTier },
      });

      // 🌟 FIX 2: Used UPSERT to completely eliminate race condition crashes
      if (session.payment_status === "paid") {
        const paymentId =
          (session.payment_intent as string) ||
          (session.invoice as string) ||
          session.id;

        await prisma.payment.upsert({
          where: { stripePaymentId: paymentId },
          update: {}, // If it already exists, do nothing safely
          create: {
            companyId: companyId,
            stripePaymentId: paymentId,
            amountCents: session.amount_total || 0,
            currency: session.currency || "usd",
            status: PaymentStatus.SUCCEEDED,
            paidAt: new Date(),
          },
        });
        console.log(
          `💵 ✅ Initial payment instantly recorded for Company: ${companyId}`,
        );
      }

      // 🚨 FIX 3: Cancel old plan AFTER database update
      if (oldSubscriptionId && oldSubscriptionId !== newSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(oldSubscriptionId);
          console.log(
            `🗑️ Canceled old subscription ${oldSubscriptionId} to prevent double billing.`,
          );
        } catch (err) {
          console.error("Failed to cancel old Stripe subscription:", err);
        }
      }

      console.log(
        `✅ Processed checkout.session.completed for company ${companyId}`,
      );
      break;
    }

    case "invoice.paid":
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as any;

      const paymentIntentId = invoice.payment_intent || invoice.id;
      const subscriptionId = invoice.subscription as string;
      const customerId = invoice.customer as string;

      // Guard if it's a non-subscription invoice
      if (!subscriptionId) return { message: "Not a subscription invoice" };

      const existingPayment = await prisma.payment.findUnique({
        where: { stripePaymentId: paymentIntentId },
      });

      if (existingPayment) return { message: "Already processed" };

      const companySub = await prisma.subscription.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (companySub) {
        const stripeSub = (await stripe.subscriptions.retrieve(
          subscriptionId,
        )) as any;

        // No transactions, prevents deadlocks on concurrent webhooks!
        await prisma.subscription.update({
          where: { id: companySub.id },
          data: {
            stripeSubscriptionId: subscriptionId,
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          },
        });

        // Use upsert to handle exact millisecond overlap safely
        await prisma.payment.upsert({
          where: { stripePaymentId: paymentIntentId },
          update: {},
          create: {
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

        console.log(
          `💵 ✅ Recurring payment receipt created for Company: ${companySub.companyId}`,
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      const companySub = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (!companySub) {
        console.log(
          `⏭️ Ignored deletion for ${subscription.id} (Company has already upgraded)`,
        );
        return { message: "Ignored old subscription deletion" };
      }

      const freePlanConfig = await prisma.planConfig.findUnique({
        where: { tier: SubscriptionPlan.FREE },
      });

      // Sequential updates instead of locked transaction
      await prisma.subscription.update({
        where: { id: companySub.id },
        data: {
          status: SubscriptionStatus.CANCELED,
          plan: SubscriptionPlan.FREE,
          planConfigId: freePlanConfig?.id,
          cancelAtPeriodEnd: false,
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
      break;
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

const getCompanyPayments = async (companyId: string) => {
  return await prisma.payment.findMany({
    where: { companyId },
    orderBy: { paidAt: "desc" },
  });
};

const cancelSubscription = async (companyId: string) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscription: true },
  });

  if (!company || !company.subscription?.stripeSubscriptionId) {
    throw new AppError(status.NOT_FOUND, "No active subscription found");
  }

  await stripe.subscriptions.update(company.subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await prisma.subscription.update({
    where: { companyId },
    data: { cancelAtPeriodEnd: true },
  });

  return {
    message: "Subscription will be canceled at the end of the billing cycle.",
  };
};

const getAllPlatformPayments = async (query: Record<string, unknown>) => {
  const paymentQuery = new QueryBuilder(prisma.payment, query, {
    searchableFields: ["stripePaymentId"],
    filterableFields: ["status", "companyId"],
  })
    .search()
    .filter()
    .paginate()
    .sort() 
    .include({
      company: { select: { name: true, logoUrl: true } },
    });

  return await paymentQuery.execute();
};

export const BillingService = {
  createCheckoutSession,
  handleStripeWebhookEvent,
  getAvailablePlans,
  seedPlanConfigs,
  updatePlanConfig,
  getCompanyPayments,
  cancelSubscription,
  getAllPlatformPayments,
};
