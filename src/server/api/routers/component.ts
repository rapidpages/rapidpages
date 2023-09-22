import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { generateNewComponent, reviseComponent } from "~/server/openai";

export const componentRouter = createTRPCRouter({
  createComponent: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      let result = "";

      if (input === "") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Prompt cannot be empty",
        });
      }

      result = await generateNewComponent(input);

      const component = await ctx.db.component.create({
        data: {
          code: result,
          authorId: userId,
          prompt: input,
          revisions: {
            create: {
              code: result,
              prompt: input,
            },
          },
        },
      });

      if (!component) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not create component",
        });
      }

      return {
        status: "success",
        data: {
          componentId: component.id,
        },
      };
    }),
  makeRevision: protectedProcedure
    .input(
      z.object({
        revisionId: z.string(),
        prompt: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const baseRevision = await ctx.db.componentRevision.findFirst({
        where: {
          id: input.revisionId,
          component: {
            authorId: userId,
          },
        },
      });

      if (!baseRevision) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No component found",
        });
      }

      const result = await reviseComponent(input.prompt, baseRevision.code);

      const newRevision = await ctx.db.componentRevision.create({
        data: {
          code: result,
          prompt: input.prompt,
          componentId: baseRevision.componentId,
        },
      });

      const updatedComponent = await ctx.db.component.update({
        where: {
          id: baseRevision.componentId,
        },
        data: {
          code: result,
          prompt: input.prompt,
          revisions: {
            connect: {
              id: newRevision.id,
            },
          },
        },
      });

      if (!newRevision || !updatedComponent) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not create revision",
        });
      }

      return {
        status: "success",
        data: {
          revisionId: newRevision.id,
        },
      };
    }),
  getComponent: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const component = await ctx.db.component.findFirst({
        where: {
          id: input,
        },
        include: {
          revisions: true,
        },
      });

      if (component) {
        return component;
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No component found",
      });
    }),
  getComponentFromRevision: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const component = await ctx.db.component.findFirst({
        where: {
          revisions: {
            some: {
              id: input,
            },
          },
        },
        include: {
          revisions: true,
        },
      });

      if (component) {
        return component;
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No component found",
      });
    }),
});
