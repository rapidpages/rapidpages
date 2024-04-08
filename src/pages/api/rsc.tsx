import { type NextApiHandler } from "next";
import { generateNewComponentStreaming } from "~/server/openai";
import { createElement } from "react";
import * as ReactServerDom from "react-server-dom-webpack/server.browser";
// @todo figure out how to use this from the ai package.. the exports map returns exports.rsc.import rather than exports.rsc.react-server
import { createStreamableUI } from "~/utils/ai";

export const config = {
  runtime: "edge",
  unstable_allowDynamic: ["."],
};

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

  const reactStream = ReactServerDom.renderToReadableStream(uiStream.value, {});

  const decoder = new TextDecoder();
  const aiStream = await generateNewComponentStreaming(prompt);

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

  return new Response(reactStream);
};

export default handler;

const source = `
<div className="min-h-screen bg-red-500 text-white">
  <div className="w-full max-w-2xl mx-auto py-10">
    <h1>Hello World</h1>
    <div className="bg-green-700 w-32 h-32 flex justify-center items-center">later</div>
    <div className="bg-blue-700 w-32 h-32 flex justify-center items-center">done</div>
  </div>
</div>`.trim();

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function evaluate(code: string) {
  const evaluateCode = (code: string, createElement) => {
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
    return evaluateCode(transformed, createElement);
  } catch (error) {
    console.error(error);
    return null;
  }
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
