import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getByUserId, getByUserIdWithPlanInfo } from "./model";
import { TRPCError } from "@trpc/server";
import { stripe } from "~/utils/stripe/config";
import { env } from "process";

export const planRouter = createTRPCRouter({
  createCheckoutSession: protectedProcedure.mutation(async ({ ctx }) => {
    const planInfo = await getByUserIdWithPlanInfo(ctx.db, ctx.session.user.id);

    if (!planInfo) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User plan not found",
      });
    }

    const { userPlan, plan } = planInfo;

    if (plan.type === "free") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User is on a free plan",
      });
    }

    const userId = userPlan.userId;
    const { email } = (await ctx.db.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        email: true,
      },
    })) || { email: null };

    let customerId = userPlan.customerId;

    // Create Stripe Customer if it doesn't exist.
    if (userPlan.customerId == null) {
      const customerData: { metadata: { rpUID: string }; email?: string } = {
        metadata: {
          rpUID: userPlan.userId,
        },
      };
      if (email) customerData.email = email;

      const customer = await stripe.customers.create(customerData);

      customerId = customer.id;

      await ctx.db.userPlan.update({
        where: {
          id: userPlan.id,
        },
        data: {
          customerId,
        },
      });
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: plan.stripe.mode,
        customer: customerId || undefined,
        client_reference_id: userId,
        line_items: [
          {
            price: plan.stripe.priceId,
            quantity: 1,
          },
        ],
        allow_promotion_codes: true,
        billing_address_collection: "required",
        success_url: `${env.NEXT_PUBLIC_URL}/settings`,
        cancel_url: `${env.NEXT_PUBLIC_URL}/settings`,
      },
      undefined,
    );

    return {
      success: true,
      data: { sessionId: session.id },
    };
  }),
  createCustomerPortalLink: protectedProcedure.mutation(async ({ ctx }) => {
    const userPlan = await getByUserId(ctx.db, ctx.session.user.id);

    if (!userPlan) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User plan not found",
      });
    }

    const customerId = userPlan.customerId;

    if (!customerId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No customer account found for this user",
      });
    }

    const { url } = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.NEXT_PUBLIC_URL}/settings`,
    });

    return {
      success: true,
      data: { url },
    };
  }),
});
