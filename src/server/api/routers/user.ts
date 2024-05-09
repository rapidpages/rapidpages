import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { create, getByUserId } from "./plan/model";
import { defaultPlan, plans } from "~/plans";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  // Deletes the user
  deleteUser: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    await ctx.db.user.delete({
      where: {
        id: userId,
      },
    });

    return {};
  }),

  getPlan: protectedProcedure.query(async ({ ctx }) => {
    const userPlan = await getByUserId(ctx.db, ctx.session.user.id);
    if (!userPlan) {
      return null;
    }

    const plan = plans.find((plan) => plan.id === userPlan.planId);

    if (!plan) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Could not find a plan for this user",
      });
    }

    return {
      userPlan,
      plan,
    };
  }),

  getPlanOrCreate: protectedProcedure.query(async ({ ctx }) => {
    const userPlan = await getByUserId(ctx.db, ctx.session.user.id);
    if (userPlan) {
      const plan = plans.find((plan) => plan.id === userPlan.planId);

      if (!plan) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not find a plan for this user",
        });
      }

      return {
        userPlan,
        plan,
      };
    }
    return {
      userPlan: await create(ctx.db, ctx.session.user.id, defaultPlan),
      plan: defaultPlan,
    };
  }),
});
