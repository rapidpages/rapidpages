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
  const prompt = request.query.p as string | undefined;

  if (!prompt) {
    return response.status(400).end();
  }

  const session = await getServerSession(request, response, authOptions);

  const userId = session?.user?.id;

  if (!userId) {
    return response.status(401).end();
  }

  // This is used to detect the type of response on the client and handle it accordingly.
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
    // const jsxTextStreamPromise = generateStreaming_test(sourceJsx);
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
    // const source = await generate_test();
    const source = await generate(prompt as string);

    const rsc = await renderToReactServerComponents(source, clientComponents);

    result.code = {
      source,
      rsc,
    };
  }

  // Everything went fine, create the component in the DB.

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
    response.end(
      // Buffer.from(
      JSON.stringify({ done: true, componentId: result.componentId }),
      // ).toString("base64"),
    );
  } else {
    response.json(result);
  }
};

export default handler;

const stateful = `<Counter />`;

// ${stateful}
const sourceJsx = `
<div className="min-h-screen bg-red-500 text-white">
  <div className="w-full max-w-2xl mx-auto py-10 flex flex-col gap-4">

    <h1 className="font-medium text-2xl">Truly Generative UI</h1>
    <p>No framework, standalone React Server Components stream-rendering UI as the LLM generates it 🤌</p>
    <div className="rounded-md bg-blue-700 w-full h-32 flex justify-center items-center">later</div>
     ${stateful}
    <div className="rounded-md bg-green-700 w-full h-32 flex justify-center items-center">done</div>
  </div>
</div>`.trim();

const sourceJsx2 = `<div className="bg-gradient-to-r from-blue-500 to-purple-500 flex flex-col items-center justify-center h-screen text-white">
  <h1 className="text-4xl font-bold mb-4">Header Text</h1>
  <h2 className="text-2xl mb-8">Subheader Text</h2>
  <a href="/page" className="bg-purple-500 text-white px-4 py-2 rounded">CTA Button</a>
</div>`;

async function generate_test() {
  return sourceJsx;
}

async function generateStreaming_test(
  source: string,
  {
    chunksAmount = 63,
    slowdown = 100,
  }: {
    chunksAmount?: number;
    slowdown?: number;
  } = {},
) {
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const len = Math.floor(source.length / chunksAmount);
      const chunks = new Array(chunksAmount)
        .fill(null)
        .map((_, i) =>
          source.slice(
            i * len,
            i === chunksAmount - 1 ? source.length : (i + 1) * len,
          ),
        );

      for (const chunk of chunks) {
        await sleep(slowdown);
        controller.enqueue(encoder.encode(chunk));
      }

      controller.close();
    },
  });
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
