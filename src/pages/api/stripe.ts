import { PlanStatus } from "@prisma/client";
import { type NextApiRequest, type NextApiHandler } from "next";
import {
  getByCustomerIdWithPlanInfo,
  update as updatePlan,
} from "~/server/api/routers/plan/model";
import { db } from "~/server/db";
import { stripe } from "~/utils/stripe/config";
import type Stripe from "stripe";
import { env } from "process";

// Stripe requires the raw body to construct the event.
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Stripe Webhooks Handler.
 *
 * Handles only subscriptions linked to plans of type "recurrent" (see `PlanRecurrent`` ~/plans.ts).
 *
 * IMPORTANT: The implementation below doesn't account for plan switching
 *            NOR for non-existent customers (`UserPlan.customerId`).
 *            Should any of these events occur the application
 *            and Stripe will be out of sync.
 *
 * Covered Webhooks events:
 *
 * - `customer.subscription.updated`. We handle:
 *   - subscriptions that will cancel at the end of their billing cycle
 *   - new or renewed subscriptions
 *   - immediately canceled subscriptions
 *   - unpaid, incomplete subscriptions (set to PlanStatus.UNPAID)
 *   - ?? any missing edge case ??
 *
 * - `customer.subscription.deleted`. We handle subscriptions deleted manually:
 *   - subscriptions that will cancel at the end of their billing cycle
 *   - immediately canceled subscriptions
 */
const handler: NextApiHandler = async (request, response) => {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).end("Method Not Allowed");
  }

  try {
    const event = await getStripeEvent(request);

    if (event == null) {
      throw new Error("An error occured while parsing the event");
    }

    console.log("Webhook: " + event.type);
    console.log(event.data);

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;

      const { plan, userPlan } =
        await getPlanInfoFromSubscription(subscription);

      if (plan.type !== "recurrent") {
        throw new Error(`Plan ${plan.type} not supported of misconfigured`);
      }

      const willCancel = subscription.cancel_at || subscription.canceled_at;

      if (typeof willCancel === "number") {
        await updatePlan(db, userPlan.userId, {
          status: PlanStatus.WILL_CANCEL,
          updatesAt: new Date(willCancel),
        });
      } else if (subscription.status === "active") {
        await updatePlan(db, userPlan.userId, {
          // Credits must not be added when
          // the subscription was scheduled for cancellation
          // but is now being renewed.
          credits:
            userPlan.status === PlanStatus.WILL_CANCEL
              ? undefined
              : plan.credits.load,
          status: PlanStatus.ACTIVE,
          updatedAt: new Date(subscription.current_period_start),
          updatesAt: new Date(subscription.current_period_end),
        });
      } else if (subscription.status === "canceled") {
        await updatePlan(db, userPlan.userId, {
          status: PlanStatus.UNPAID,
          updatesAt: null,
        });
      } else {
        await updatePlan(db, userPlan.userId, {
          status: PlanStatus.UNPAID,
        });
      }

      return response.json({ received: true });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;

      const { userPlan } = await getPlanInfoFromSubscription(subscription);

      const willCancel = subscription.cancel_at || subscription.canceled_at;

      if (typeof willCancel === "number") {
        await updatePlan(db, userPlan.userId, {
          status: PlanStatus.WILL_CANCEL,
          updatesAt: new Date(willCancel),
        });
      } else {
        await updatePlan(db, userPlan.userId, {
          status: PlanStatus.UNPAID,
          updatesAt: null,
        });
      }
    }

    throw new Error("Unhandled relevant event!");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Something went wrong";
    console.error(`❌ Error message: ${errorMessage}`);

    return response
      .status(400)
      .send('Webhook Error: "Webhook handler failed. View logs."');
  }
};

export default handler;

async function getStripeEvent(request: NextApiRequest) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const signature = request.headers["stripe-signature"];
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) return null;

  return stripe.webhooks.constructEvent(
    Buffer.concat(chunks),
    signature,
    webhookSecret,
  );
}

async function getPlanInfoFromSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const planInfo = await getByCustomerIdWithPlanInfo(db, customerId);

  if (!planInfo) {
    throw new Error(`Plan not found for customer ${customerId}`);
  }

  const { plan } = planInfo;

  if (plan.type === "free") {
    throw new Error(
      `Customer ${customerId} is on a free plan but created a subscription`,
    );
  }

  if (
    !subscription.items.data.some(
      (item) => item.price.id === plan.stripe.priceId,
    )
  ) {
    throw new Error(
      `The subscription priceId does't match the user plan's one`,
    );
  }

  return planInfo;
}
