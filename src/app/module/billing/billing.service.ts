// src/app/module/billing/billing.service.ts
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

// 1. Create Checkout Session
const createCheckoutSession = async (companyId: string, priceId: string) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscription: true }
  });

  if (!company) throw new AppError(status.NOT_FOUND, "Company not found");

  let customerId = company.subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: company.name,
      metadata: { companyId: company.id }, 
    });
    customerId = customer.id;

    await prisma.subscription.upsert({
      where: { companyId },
      update: { stripeCustomerId: customerId },
      create: { companyId, stripeCustomerId: customerId }
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${envVars.FRONTEND_URL}/dashboard/billing?success=true`,
    cancel_url: `${envVars.FRONTEND_URL}/dashboard/billing?canceled=true`,
    client_reference_id: companyId,
    metadata: { companyId }, // Passing metadata like in your sample
  });

  return { url: session.url };
};

// 2. Handle Stripe Webhook Events
const handleStripeWebhookEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    
    // Triggered when a user first successfully subscribes
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const companyId = session.client_reference_id || session.metadata?.companyId;

      if (!companyId) {
        console.error("Missing companyId in session client_reference_id/metadata");
        return { message: "Missing companyId in session" };
      }

      await prisma.subscription.update({
        where: { companyId },
        data: {
          stripeSubId: session.subscription as string,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      console.log(`Processed checkout.session.completed for company ${companyId}`);
      break;
    }

   // Triggered on the initial payment AND all recurring monthly/yearly payments
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as any;
      const paymentIntentId = invoice.payment_intent;
      const subscriptionId = invoice.subscription;

      const existingPayment = await prisma.payment.findUnique({
        where: { stripePaymentId: paymentIntentId }
      });

      if (existingPayment) {
        console.log(`Payment ${paymentIntentId} already processed. Skipping.`);
        return { message: `Payment ${paymentIntentId} already processed. Skipping.` };
      }

      // 2. Fetch from Stripe and cast to 'any'
      const stripeSub = (await stripe.subscriptions.retrieve(
        subscriptionId
      )) as any;
      
      const productId = stripeSub.items.data[0].price.product;
      const product = (await stripe.products.retrieve(productId)) as any;
      
      const purchasedPlan = (product.metadata.planName || "FREE") as SubscriptionPlan;

      const companySub = await prisma.subscription.findUnique({
        where: { stripeSubId: subscriptionId },
      });

      if (companySub) {
        await prisma.$transaction([
          prisma.subscription.update({
            where: { id: companySub.id },
            data: {
              status: SubscriptionStatus.ACTIVE,
              plan: purchasedPlan,
              // 3. No more TS errors here!
              currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            },
          }),
          prisma.company.update({
            where: { id: companySub.companyId },
            data: { plan: purchasedPlan },
          }),
          prisma.payment.create({
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
          }),
        ]);
        console.log(`Processed invoice.payment_succeeded for subscription ${subscriptionId}`);
      }
      break;
    }

    // Triggered if the subscription is canceled or fails to renew
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      const companySub = await prisma.subscription.update({
        where: { stripeSubId: subscription.id },
        data: {
          status: SubscriptionStatus.CANCELED,
          plan: SubscriptionPlan.FREE,
        },
      });

      await prisma.company.update({
        where: { id: companySub.companyId },
        data: { plan: SubscriptionPlan.FREE },
      });
      
      console.log(`Processed customer.subscription.deleted for ${subscription.id}`);
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return { message: `Webhook Event ${event.id} processed successfully` };
};

export const BillingService = {
  createCheckoutSession,
  handleStripeWebhookEvent,
};