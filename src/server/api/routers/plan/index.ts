import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { create, getByUserId } from "./model";
import { defaultPlan } from "~/plans";

export const privatePlanRouter = createTRPCRouter({
  create: publicProcedure
    // @todo allow to pass plan too.
    .input(z.string().describe("User ID"))
    .mutation(({ ctx, input }) => create(ctx.db, input, defaultPlan)),
  getByUserId: publicProcedure
    .input(z.string().describe("User ID"))
    .query(({ ctx, input }) => getByUserId(ctx.db, input)),
});
