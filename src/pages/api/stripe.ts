import { PlanStatus } from "@prisma/client";
import { type NextApiRequest, type NextApiHandler } from "next";
import {
  getByCustomerId,
  getByCustomerIdWithPlanInfo,
  updateByCustomerId,
  update as updatePlan,
} from "~/server/api/routers/plan/model";
import { db } from "~/server/db";
import { stripe } from "~/utils/stripe/config";
import type Stripe from "stripe";
import { env } from "process";
import { type PlanSubscription, plans } from "~/plans";

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

  let eventId;
  try {
    const event = await getStripeEvent(request);

    if (event == null) {
      throw new Error("An error occured while parsing the event");
    }

    eventId = event.id;

    console.log("Webhook: " + event.type);
    console.log(event.data);

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;

      const { plan, customerId } =
        await getPlanInfoFromSubscription(subscription);

      const willCancel =
        subscription.status === "active" && subscription.cancel_at_period_end;

      if (willCancel) {
        await updateByCustomerId(db, customerId, {
          status: PlanStatus.WILL_CANCEL,
          updatesAt: new Date(
            subscription.cancel_at || subscription.current_period_end,
          ),
        });
      } else if (subscription.status === "active") {
        const userPlan = await getByCustomerId(db, customerId);
        await updateByCustomerId(db, customerId, {
          planId: plan.id,
          // Credits must not be added when
          // the subscription was scheduled for cancellation
          // but is now being renewed.
          // @todo Check whether this update can be done without fetching the userPlan first
          credits:
            userPlan && userPlan.status !== PlanStatus.WILL_CANCEL
              ? plan.credits
              : undefined,
          status: PlanStatus.ACTIVE,
          updatedAt: new Date(subscription.current_period_start),
          updatesAt: new Date(subscription.current_period_end),
        });
      } else if (subscription.status === "canceled") {
        const { unsubscribeTo } = plan;
        const unsubscribeToPlan = plans.find(
          (plan) => plan.id === unsubscribeTo,
        );

        await updateByCustomerId(db, customerId, {
          planId: plan.unsubscribeTo,
          status:
            unsubscribeToPlan && unsubscribeToPlan.type !== "subscription"
              ? PlanStatus.ACTIVE
              : PlanStatus.UNPAID,
          updatedAt: new Date(),
          updatesAt: null,
        });

        if (!unsubscribeToPlan) {
          throw new Error(`Unsubsscribe plan for plan id ${plan.id} not found`);
        }
      } else {
        await updateByCustomerId(db, customerId, {
          planId: plan.id,
          status: PlanStatus.UNPAID,
          updatedAt: new Date(subscription.current_period_start),
          updatesAt: new Date(subscription.current_period_end),
        });
      }

      return response.json({ received: true });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;

      const { plan, customerId } =
        await getPlanInfoFromSubscription(subscription);

      const willCancel =
        subscription.status === "active" && subscription.cancel_at_period_end;

      if (willCancel) {
        await updateByCustomerId(db, customerId, {
          status: PlanStatus.WILL_CANCEL,
          updatesAt: new Date(
            subscription.cancel_at || subscription.current_period_end,
          ),
        });
      } else {
        const { unsubscribeTo } = plan;
        const unsubscribeToPlan = plans.find(
          (plan) => plan.id === unsubscribeTo,
        );

        await updateByCustomerId(db, customerId, {
          planId: plan.unsubscribeTo,
          status:
            unsubscribeToPlan && unsubscribeToPlan.type !== "subscription"
              ? PlanStatus.ACTIVE
              : PlanStatus.UNPAID,
          updatedAt: new Date(),
          updatesAt: null,
        });

        if (!unsubscribeToPlan) {
          throw new Error(`Unsubsscribe plan for plan id ${plan.id} not found`);
        }
      }
    }

    throw new Error("Unhandled relevant event!");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Something went wrong";
    console.error(
      `❌ Stripe Webhook Error:\nEventId: ${
        eventId || "unknown"
      }\n:Message: ${errorMessage}`,
    );

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

function error(event: Stripe.Event, message: string) {
  throw new Error(`Event #${event.id}: ${message}`);
}

async function getPlanInfoFromSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const plan = plans.find(
    (plan) =>
      plan.type === "subscription" &&
      subscription.items.data.some(
        (item) => item.price.id === plan.stripe.priceId,
      ),
  ) as PlanSubscription | undefined;

  if (!plan) {
    throw new Error("Plan not found");
  }

  return {
    plan,
    customerId,
  };
}
