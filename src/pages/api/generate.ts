import { type NextApiHandler } from "next";
import { env } from "~/env.mjs";
import { db } from "~/server/db";
import { generate, generateStreaming } from "~/server/openai";
import {
  renderToReactServerComponents,
  renderStreamReactServerComponents,
} from "~/utils/render";
import { getServerSession } from "next-auth/next";
import { authOptions } from "~/server/auth";
import { clientComponents } from "~/utils/available-client-components";
import {
  consumeCredits,
  CreditsError,
  increaseCredits,
} from "~/server/api/routers/plan/model";

export const config = {
  // Set the value manually because Next.js doesn't support "dynamic config"
  // i.e. can't read env.RAPIDPAGES_UNSTABLE_STREAMING
  supportsResponseStreaming: false,
  maxDuration: 60,
};
if (config.supportsResponseStreaming != env.RAPIDPAGES_UNSTABLE_STREAMING) {
  throw new Error(
    "generation endpoint: invalid value for config.supportsResponseStreaming",
  );
}

const handler: NextApiHandler = async (request, response) => {
  const { prompt } = request.body;

  if (request.method !== "POST" || !prompt) {
    response.status(400).end();
    return;
  }

  const session = await getServerSession(request, response, authOptions);

  const userId = session?.user?.id;

  if (!userId) {
    response.status(401).end();
    return;
  }

  let credits = {
    left: 0,
    used: 0,
  };

  try {
    credits = await consumeCredits(db, "create", userId);
  } catch (error) {
    response.statusMessage =
      error instanceof CreditsError
        ? error.message
        : "An error occured while validating your credits, please contact us.";

    response.status(403).end(response.statusMessage);
    return;
  }

  // This is used to detect the type of response on the client
  // (streaming or not (json)) and handle it accordingly.
  response.setHeader(
    "Content-Type",
    env.RAPIDPAGES_UNSTABLE_STREAMING ? "text/plain" : "application/json",
  );

  const result = {
    code: {
      source: "",
      rsc: "",
    },
    done: true,
    componentId: "",
    credits,
    error: "",
  };

  try {
    if (env.RAPIDPAGES_UNSTABLE_STREAMING === true) {
      const jsxTextStreamPromise = generateStreaming(prompt as string).catch(
        async (error) => {
          if (credits.used > 0) {
            await increaseCredits(db, userId, credits.used);
          }

          result.credits = {
            left: credits.left + credits.used,
            used: 0,
          };

          throw error;
        },
      );

      const { source, rsc } = await renderStreamReactServerComponents(
        jsxTextStreamPromise,
        response,
        clientComponents,
      );

      result.code = {
        source,
        rsc,
      };
    } else {
      const source = await generate(prompt as string).catch(async (error) => {
        if (credits.used > 0) {
          await increaseCredits(db, userId, credits.used);
        }

        result.credits = {
          left: credits.left + credits.used,
          used: 0,
        };

        throw error;
      });

      const rsc = await renderToReactServerComponents(source, clientComponents);

      result.code = {
        source,
        rsc,
      };
    }
  } catch (error) {
    console.error(error);

    result.error = "Something went wrong";

    if (env.RAPIDPAGES_UNSTABLE_STREAMING === true) {
      response.status(500).end("$rschunk:" + JSON.stringify(result));
    } else {
      response.status(500).json(result);
    }

    return;
  }

  const component = await db.component.create({
    data: {
      code: result.code.source,
      authorId: userId,
      prompt,
      revisions: {
        create: {
          code: result.code.source,
          prompt,
        },
      },
    },
  });

  result.componentId = component.id;

  if (env.RAPIDPAGES_UNSTABLE_STREAMING === true) {
    response.end("$rschunk:" + JSON.stringify(result));
  } else {
    response.json(result);
  }
};

export default handler;
