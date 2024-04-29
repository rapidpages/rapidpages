// @ts-expect-error there are no module declarations for react-server-dom-webpack
import * as ReactServerDOM from "react-server-dom-webpack/server.node";
import { Transform, Writable } from "node:stream";
import {
  type ClientComponentsWebpackManifest,
  transformJsx,
  evaluateReact,
  type ClientComponent,
} from "./compiler-modern";
import { createResolvablePromise } from "./utils";
import { createStreamableUI } from "./create-streamable-ui";

export async function renderToReactServerComponents<
  AvailableComponents extends string,
>(
  source: string,
  clientComponents: Record<AvailableComponents, ClientComponent>,
): Promise<string> {
  const clientComponentsWebpackManifest: ClientComponentsWebpackManifest = {};

  const reactTree = evaluateReact(
    transformJsx(source),
    clientComponents,
    clientComponentsWebpackManifest,
  );

  const {
    resolve,
    reject,
    promise: resultPromise,
  } = createResolvablePromise<string>();

  // @todo Figure out if there is a better way to render to
  // React Server Components format without streaming!
  // If so we can avoid this hack of piping to a Writable stream.
  const { pipe } = ReactServerDOM.renderToPipeableStream(
    reactTree,
    clientComponentsWebpackManifest,
  );

  let result = "";

  const decoder = new TextDecoder();
  const destination = new Writable({
    write: (chunk, encoding, callback) => {
      const rsc = decoder.decode(chunk);
      result += rsc;
      callback();
    },
  });

  destination.on("error", (error) => {
    reject(error);
  });

  destination.on("finish", () => {
    resolve(result);
  });

  pipe(destination);

  return resultPromise;
}

// @todo Currently this doesn't work reliably,
// likely because the destination stream (the response) is slow,
// we need to implement backpressure and see if that fixes the issue.
export async function renderStreamReactServerComponents<
  AvailableComponents extends string,
>(
  sourceStreamPromise: Promise<ReadableStream>,
  destination: Writable,
  clientComponents: Record<AvailableComponents, ClientComponent>,
): Promise<{ source: string; rsc: string }> {
  const clientComponentsWebpackManifest: ClientComponentsWebpackManifest = {};

  const uiStream = createStreamableUI(<></>);

  const { pipe } = ReactServerDOM.renderToPipeableStream(
    uiStream.value,
    clientComponentsWebpackManifest,
  );

  let source = "";
  let rsc = "";

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  // Transform the RSC payload stream to a stream of
  // { rsc, source, done } so that the client gets both the RSC payload
  // and the raw source to render the code to copy/paste
  const transform = new Transform({
    transform(chunk, encoding, callback) {
      const rscChunk = decoder.decode(chunk);
      rsc += rscChunk;

      callback(
        null,
        encoder.encode(
          // Buffer.from(
          JSON.stringify({
            code: {
              rsc: rscChunk,
              source,
            },
            done: false,
            // @todo extract external components imports and add them here
          }),
          // ).toString("base64") + "\n",
        ),
      );
    },
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore ReactServerDOM.renderToPipeableStream ends the `transform` stream when it is done rendering. We don't want that.
  transform.end = () => {};

  pipe(transform);
  transform.pipe(destination);

  const {
    resolve,
    reject,
    promise: resultPromise,
  } = createResolvablePromise<{ source: string; rsc: string }>();

  const sourceStream = await sourceStreamPromise.catch((error) => {
    reject(error);
    throw error;
  });

  // Consume the sourceStream:
  // - Accumulate JSX
  // - Parse and evaluate it to React
  // - update the uiStream (flush to the client)
  (async () => {
    const reader = sourceStream.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        uiStream.done();
        try {
          evaluateReact(
            transformJsx(source),
            clientComponents,
            clientComponentsWebpackManifest,
          );
        } catch (error) {
          reject("Rendering failed");
        }
        break;
      }

      source += decoder.decode(value);
      source = source.replace(/jsx/, "").replace(/```\s*$/, "");

      try {
        const reactTree = evaluateReact(
          transformJsx(source),
          clientComponents,
          clientComponentsWebpackManifest,
        );

        if (reactTree) {
          uiStream.update(reactTree);
        }
      } catch (error) {
        continue;
      }
    }

    reader.releaseLock();

    resolve({
      source,
      rsc,
    });
  })();

  return resultPromise;
}
