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
import { consumeCredits, CreditsError } from "~/server/api/routers/plan/model";

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
    return response.status(400).end();
  }

  const session = await getServerSession(request, response, authOptions);

  const userId = session?.user?.id;

  if (!userId) {
    return response.status(401).end();
  }

  let credits;

  try {
    credits = await consumeCredits(db, "create", userId);
  } catch (error) {
    response.statusMessage =
      error instanceof CreditsError
        ? error.message
        : "An error occured while validating your credits, please contact us.";

    return response.status(403).end(response.statusMessage);
  }

  // This is used to detect the type of response on the client
  // (streaming or not (json)) and handle it accordingly.
  response.setHeader(
    "content-type",
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
  };

  if (env.RAPIDPAGES_UNSTABLE_STREAMING === true) {
    const jsxTextStreamPromise = generateStreaming(prompt as string);

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
    const source = await generate(prompt as string);

    const rsc = await renderToReactServerComponents(source, clientComponents);

    result.code = {
      source,
      rsc,
    };
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
