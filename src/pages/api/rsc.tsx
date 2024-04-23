import { type NextApiHandler } from "next";
import { generateNewComponentStreaming } from "~/server/openai";
import { createElement, Suspense } from "react";
import * as ReactServerDom from "react-server-dom-webpack/server.browser";
// @todo figure out how to use this from the ai package.. the exports map returns exports.rsc.import rather than exports.rsc.react-server
import { createStreamableUI } from "~/utils/ai";
import { now } from "next-auth/client/_utils";

export const config = {
  runtime: "edge",
  unstable_allowDynamic: ["."],
};

const clientComponentsMap = {};

const handler: NextApiHandler = async (request) => {
  const prompt = new URL(request.url).searchParams.get("p");

  if (!prompt) {
    return new Response("Missing prompt", {
      status: 400,
      statusText: "Missing prompt",
    });
  }

  const reactTree = <></>;

  const uiStream = createStreamableUI(reactTree);

  const reactStream = ReactServerDom.renderToReadableStream(
    uiStream.value,
    clientComponentsMap,
  );
  const decoder = new TextDecoder();
  // const aiStream = await generateNewComponentStreaming(prompt);

  const aiStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      // Push some data into the stream
      const chunksNo = 5;
      const len = Math.floor(source.length / chunksNo);
      const chunks = new Array(chunksNo)
        .fill(null)
        .map((_, i) =>
          source.slice(
            i * len,
            i === chunksNo - 1 ? source.length : (i + 1) * len,
          ),
        );

      for (const chunk of chunks) {
        await sleep(1000);
        controller.enqueue(encoder.encode(chunk));
      }

      controller.close();
    },
  });

  (async () => {
    let jsxCode = "";
    const reader = aiStream.getReader();
    let flushedAt = 0;

    while (true) {
      const { done, value } = await reader.read();
      const now = Date.now();

      if (!done) {
        jsxCode += decoder.decode(value);
        jsxCode = jsxCode.replace(/jsx/, "").replace(/```\s*$/, "");

        if (flushedAt > 0 && now - flushedAt < 1000) {
          continue;
        }
      }

      const reactTree = await evaluate(jsxCode);

      if (reactTree) {
        // console.log(reactTree);
        uiStream.update(reactTree);
        flushedAt = now;
      }

      if (done) {
        uiStream.done();
        break;
      }
    }

    reader.releaseLock();
  })();

  // (async () => {
  //   let jsxCode = "";
  //   const reader = aiStream.getReader();
  //   const flushedAt = 0;

  //   while (true) {
  //     const { done, value } = await reader.read();

  //     if (done) {
  //       uiStream.done();
  //       break;
  //     }

  //     jsxCode += decoder.decode(value);
  //     jsxCode = jsxCode.replace(/jsx/, "").replace(/```\s*$/, "");

  //     const reactTree = await evaluate(jsxCode);

  //     if (reactTree) {
  //       // console.log(reactTree);
  //       uiStream.update(reactTree);
  //     }
  //   }

  //   reader.releaseLock();
  // })();

  return new Response(reactStream, {
    headers: {
      "content-type": "text/x-component",
    },
  });
};

export default handler;

const stateful = `<Counter />`;

const source = `
<div className="min-h-screen bg-red-500 text-white">
  <div className="w-full max-w-2xl mx-auto py-10 flex flex-col gap-4">
    <h1 className="font-medium text-2xl">Truly Generative UI</h1>
    <p>No framework, standalone React Server Components stream-rendering UI as the LLM generates it 🤌</p>
    <div className="rounded-md bg-blue-700 w-full h-32 flex justify-center items-center">later</div>
    ${stateful}
    <div className="rounded-md bg-green-700 w-full h-32 flex justify-center items-center">done</div>
  </div>
</div>`.trim();

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function evaluate(code: string) {
  const evaluateCode = (code: string, createElement) => {
    // return function App() {
    //   return eval(code);
    // };
    return eval(code);
  };

  try {
    const res = await fetch("http://localhost:3000/api/transform", {
      method: "POST",
      headers: {
        accept: "text/plain",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        code,
      }),
    });

    if (!res.ok) {
      throw new Error("next");
    }

    const transformed = await res.text();

    return evaluateCode(
      transformed.replace(
        /createElement\(([A-Z][^,)]+)/g,
        'createElement("__client.$1"',
      ),
      createElementWithClient,
    );
  } catch (error) {
    console.error(error);
    return null;
  }
}

const clientComponents = {};

function createElementWithClient(t, ...rest) {
  if (typeof t === "string" && t.startsWith("__client.")) {
    if (!clientComponents[t]) {
      function Component() {}
      Component.$$typeof = Symbol.for("react.client.reference");
      Component.$$id = t;
      clientComponents[t] = Component;
      // [id, chunks, name, async]
      // clientComponentsMap[t] = [`/g/test.js`, [], t, true];
      clientComponentsMap[t] = {
        id: `/g/test.js`,
        // Use the detected export name
        name: t.slice("__client.".length),
        // Turn off chunks. This is webpack-specific
        chunks: [],
        // Use an async import for the built resource in the browser
        async: true,
      };
    }
    t = clientComponents[t];
    // return createElement(Suspense, null, createElement(t, ...rest));
  }

  return createElement(t, ...rest);
}

// Simulate ai stream
// const aiStream = new ReadableStream({
//   async start(controller) {
//     // Push some data into the stream
//     const len = Math.floor(source.length / 5);
//     const chunks = new Array(5)
//       .fill(null)
//       .map((_, i) =>
//         source.slice(i * len, i === 4 ? source.length : (i + 1) * len),
//       );

//     for (const chunk of chunks) {
//       await sleep(1000);
//       controller.enqueue(chunk);
//     }

//     controller.close();
//   },
// });
// Simulate streaming rendering
// (async () => {
//   const len = Math.floor(source.length / 5);
//   const chunks = new Array(5)
//     .fill(null)
//     .map((_, i) =>
//       source.slice(i * len, i === 4 ? source.length : (i + 1) * len),
//     );
// let jsxCode = "";
// let transformed = "";

// for (const chunk of chunks) {
//   await sleep(1000);
//   jsxCode += chunk;

//   try {
//     const res = await fetch("http://localhost:3000/api/transform", {
//       method: "POST",
//       headers: {
//         accept: "text/plain",
//         "content-type": "application/json",
//       },
//       body: JSON.stringify({
//         code: jsxCode,
//       }),
//     });

//     if (!res.ok) {
//       throw new Error("next");
//     }
//     transformed = await res.text();
//     reactTree = evaluateCode(transformed, createElement);
//   } catch (error) {
//     console.error(error);
//     continue;
//   }

//   uiStream.update(<pre>{reactTree}</pre>);
// }

// uiStream.done();
