import { createRoot } from "react-dom/client";
import {
  createFromFetch,
  createFromReadableStream,
} from "react-server-dom-webpack/client";

const root = createRoot(document.getElementById("root"));

// createFromFetch(fetch("/api/rsc" + window.location.search)).then((comp) => {
//   console.log(comp);
//   root.render(comp);
// });

let onChunk = (chunk) => {};
let onDone = () => {};

const rscStream = new ReadableStream({
  async start(controller) {
    const encoder = new TextEncoder();
    onChunk = (chunk) => {
      controller.enqueue(encoder.encode(chunk));
    };
    onDone = () => controller.close();
  },
});

fetch("/api/rsc" + window.location.search).then(async (response) => {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No reader");
  }

  const decoder = new TextDecoder();

  createFromReadableStream(rscStream).then((comp) => {
    root.render(comp);
  });

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      onDone();
      return;
    }

    try {
      const json = JSON.parse(decoder.decode(value));
      console.log(json);
      onChunk(json.rsc);
    } catch {}
  }
});
