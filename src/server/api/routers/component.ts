import { ComponentVisibility } from "@prisma/client";
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
  forkRevision: protectedProcedure
    .input(
      z.object({
        revisionId: z.string(),
        includePrevious: z.boolean().default(false).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { revisionId, includePrevious } = input;

      const component = await ctx.db.component.findFirst({
        where: {
          revisions: {
            some: {
              id: revisionId,
            },
          },
        },
        include: {
          revisions: true,
        },
      });

      const revisionIndex = component?.revisions.findIndex(
        (rev) => rev.id === revisionId,
      );
      if (!component || revisionIndex === undefined) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No revision found",
        });
      }

      const revisions = (
        includePrevious
          ? component.revisions.slice(0, revisionIndex)
          : [component.revisions[revisionIndex]]
      )
        .filter(function <T>(rev: T): rev is NonNullable<T> {
          return rev !== undefined;
        })
        .map(({ code, prompt }) => ({ code, prompt }));

      if (revisions.length < 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No revision found",
        });
      }

      const userId = ctx.session.user.id;

      // Users can fork public revisions or, if private, their own.
      if (
        component.authorId != userId &&
        component.visibility === ComponentVisibility.PRIVATE
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You don't have the permission to fork this revision",
        });
      }

      const newComponent = await ctx.db.component.create({
        data: {
          code: revisions[0]!.code,
          authorId: userId,
          prompt: revisions[0]!.prompt,
          revisions: {
            create: revisions,
          },
        },
        include: {
          revisions: true,
        },
      });

      if (!newComponent) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not create component",
        });
      }

      return {
        status: "success",
        data: {
          revisionId: newComponent.revisions[0]!.id,
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
        const userId = ctx.session?.user.id;

        if (
          component.authorId !== userId &&
          component.visibility === ComponentVisibility.PRIVATE
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
          });
        }

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
        const userId = ctx.session?.user.id;

        if (
          component.authorId !== userId &&
          component.visibility === ComponentVisibility.PRIVATE
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
          });
        }

        return component;
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No component found",
      });
    }),
  getMyComponents: protectedProcedure
    .input(
      z.object({
        pageIndex: z.number().default(0),
        pageSize: z.number().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const componentCount = await ctx.db.component.count({
        where: {
          authorId: userId,
        },
      });

      const components = await ctx.db.component.findMany({
        where: {
          authorId: userId,
        },
        include: {
          revisions: true,
        },
        take: input.pageSize,
        skip: input.pageSize * input.pageIndex,
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        status: "success",
        data: {
          rows: components,
          pageCount: Math.ceil(componentCount / input.pageSize),
        },
      };
    }),
});

/**
 * componentImportRouter allows to create a component from arbitrary code blocks.
 * In most cases this would be a priviledged endpoint that only admins can use.
 *
 * @todo Expose this via API (public or private TBD)
 * and perhaps implement ad-hoc procedure rather than use protectedProcedure.
 */
export const componentImportRouter = createTRPCRouter({
  importComponent: protectedProcedure
    .input(
      z.object({
        /* @todo set max length ? */
        code: z.string(),
        description: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { code, description } = input;

      // @todo validate code
      if (!code /* || !isValid(code) */) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid code snippet",
        });
      }

      const component = await ctx.db.component.create({
        data: {
          code,
          authorId: null,
          prompt: description,
          revisions: {
            create: {
              code,
              prompt: description,
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
});
