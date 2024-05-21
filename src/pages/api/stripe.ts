import { PlanStatus, type UserPlan } from "@prisma/client";
import { type NextApiRequest, type NextApiHandler } from "next";
import {
  getByCustomerId,
  updateByCustomerId,
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
 * Handles only subscriptions linked to plans of type "subscription" (see `PlanSubscription`` ~/plans.ts).
 *
 * IMPORTANT: The implementation below doesn't account for
 *            non-existent customers (`UserPlan.customerId`).
 *            This might be the case when the customer is created in
 *            the Stripe Dashboard directly and is not linked to a user in the app.
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

    // console.log("Webhook: " + event.type);
    // console.log(event.data);

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
        await handleCancellation(
          plan,
          customerId,
          subscription.cancellation_details?.comment ===
            `$rs.deleted.${customerId}`,
        );
      } else {
        await updateByCustomerId(db, customerId, {
          planId: plan.id,
          status: PlanStatus.UNPAID,
          credits: 0,
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
        await handleCancellation(
          plan,
          customerId,
          subscription.cancellation_details?.comment ===
            `$rs.deleted.${customerId}`,
        );
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

async function handleCancellation(
  plan: PlanSubscription,
  customerId: NonNullable<UserPlan["customerId"]>,
  isUserDeletion: boolean,
) {
  // When deleting a user we cancel subscriptions
  // and don't need to update the UserPlan.
  // In fact the row in the DB will be already deleted by then.
  if (isUserDeletion && !(await getByCustomerId(db, customerId))) {
    return;
  }

  const { unsubscribeTo } = plan;
  const unsubscribeToPlan = plans.find((plan) => plan.id === unsubscribeTo);

  let updatesAt = null;
  if (unsubscribeToPlan && unsubscribeToPlan.type === "free") {
    updatesAt = new Date();
    updatesAt.setDate(updatesAt.getDate() + unsubscribeToPlan.interval);
  }

  await updateByCustomerId(db, customerId, {
    planId: unsubscribeTo,
    status:
      unsubscribeToPlan && unsubscribeToPlan.type !== "subscription"
        ? PlanStatus.ACTIVE
        : PlanStatus.UNPAID,
    credits:
      unsubscribeToPlan && "credits" in unsubscribeToPlan
        ? unsubscribeToPlan.credits
        : 0,
    updatedAt: new Date(),
    updatesAt,
  });

  if (!unsubscribeToPlan) {
    throw new Error(`Unsubsscribe plan for plan id ${plan.id} not found`);
  }
}
