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

export const config = {
  supportsResponseStreaming: env.RAPIDPAGES_UNSTABLE_STREAMING,
  maxDuration: 60,
};

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
