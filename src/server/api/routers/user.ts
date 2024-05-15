import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { create, getByUserIdWithPlanInfo } from "./plan/model";
import { defaultPlan } from "~/plans";
import { TRPCError } from "@trpc/server";
import { stripe } from "~/utils/stripe/config";

export const userRouter = createTRPCRouter({
  // Deletes the user
  deleteUser: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const planInfo = await getByUserIdWithPlanInfo(ctx.db, userId);

    if (planInfo) {
      const { plan, userPlan } = planInfo;
      if (plan.type === "subscription" && userPlan.customerId) {
        const subscriptions = await stripe.subscriptions.list({
          customer: userPlan.customerId,
        });

        const subscriptionsCancellationPromises = subscriptions.data.map(
          (subscription) =>
            subscription.items.data.some(
              (item) => item.price.id === plan.stripe.priceId,
            )
              ? stripe.subscriptions.cancel(subscription.id, {
                  cancellation_details: {
                    comment: `$rs.deleted.${userPlan.customerId}`,
                  },
                })
              : Promise.resolve(),
        );

        await Promise.all(subscriptionsCancellationPromises);
      }
    }

    await ctx.db.user.delete({
      where: {
        id: userId,
      },
    });

    return {};
  }),

  getPlan: protectedProcedure.query(async ({ ctx }) => {
    const planInfo = await getByUserIdWithPlanInfo(ctx.db, ctx.session.user.id);

    if (!planInfo) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Could not find a plan for this user",
      });
    }

    return planInfo;
  }),

  getPlanOrCreate: protectedProcedure.query(async ({ ctx }) => {
    const planInfo = await getByUserIdWithPlanInfo(ctx.db, ctx.session.user.id);

    if (planInfo) {
      return planInfo;
    }

    return {
      userPlan: await create(ctx.db, ctx.session.user.id, defaultPlan),
      plan: defaultPlan,
    };
  }),
});
