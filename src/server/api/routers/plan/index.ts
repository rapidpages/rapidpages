import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { create, getByUserId } from "./model";
import { defaultPlan, plans } from "~/plans";

export const privatePlanRouter = createTRPCRouter({
  create: publicProcedure
    // @todo allow to pass plan too.
    .input(z.string().describe("User ID"))
    .mutation(({ ctx, input }) => create(ctx.db, input, defaultPlan)),
  getByUserId: publicProcedure
    .input(z.string().describe("User ID"))
    .query(async ({ ctx, input }) => {
      const userPlan = await getByUserId(ctx.db, input);
      if (!userPlan) {
        return null;
      }
      return {
        userPlan,
        plan: plans.find((plan) => plan.id === userPlan.planId),
      };
    }),
});
