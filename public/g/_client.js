import { startTransition } from "react";
import { createRoot } from "react-dom/client";
import { createFromReadableStream } from "react-server-dom-webpack/client";

const root = createRoot(document.getElementById("root"));

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

window.addEventListener("message", (event) => {
  if (event.origin !== window.origin) return;

  try {
    const { type, done, value } = JSON.parse(event.data);

    if (type !== "rsc" || done) {
      return;
    }

    onChunk(value);
  } catch {}
});

createFromReadableStream(rscStream).then((ui) => {
  startTransition(() => {
    root.render(ui);
  });
});
