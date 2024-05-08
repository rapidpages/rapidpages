import { privatePlanRouter } from "~/server/api/routers/plan";
import {
  createInnerTRPCContext,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

/**
 * This is the router for your private API.
 */
export const privateRouter = createTRPCRouter({
  healthcheck: publicProcedure.query(() => "ok"),
  userPlan: privatePlanRouter,
});

/**
 * This is an instance of the API that can be used on the server.
 */
export const privateApi = privateRouter.createCaller(
  createInnerTRPCContext({ session: null }),
);

// export type definition of API
export type PrivateRouter = typeof privateRouter;
