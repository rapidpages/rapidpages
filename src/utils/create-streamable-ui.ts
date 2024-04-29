/* eslint-disable */
// @ts-nocheck

// Extracted from https://github.com/vercel/ai/blob/d2bc2aa28702cfcdff8b9268bc6b72611f6c6b31/packages/core/rsc/streamable.tsx#L24
//
// Copyright 2023 Vercel, Inc.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// rsc/utils.tsx
import { Suspense } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function createResolvablePromise() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve,
    reject,
  };
}

const R = [
  async ({
    c,
    // current
    n,
    // next
  }) => {
    const chunk = await n;
    if (chunk.done) {
      return chunk.value;
    }
    if (chunk.append) {
      return /* @__PURE__ */ jsxs(Fragment, {
        children: [
          c,
          /* @__PURE__ */ jsx(Suspense, {
            fallback: chunk.value,
            children: /* @__PURE__ */ jsx(R, { c: chunk.value, n: chunk.next }),
          }),
        ],
      });
    }
    return /* @__PURE__ */ jsx(Suspense, {
      fallback: chunk.value,
      children: /* @__PURE__ */ jsx(R, { c: chunk.value, n: chunk.next }),
    });
  },
][0];

function createSuspensedChunk(initialValue) {
  const { promise, resolve, reject } = createResolvablePromise();
  return {
    row: /* @__PURE__ */ jsx(Suspense, {
      fallback: initialValue,
      children: /* @__PURE__ */ jsx(R, { c: initialValue, n: promise }),
    }),
    resolve,
    reject,
  };
}

// rsc/constants.ts
const DEV_DEFAULT_STREAMABLE_WARNING_TIME = 15 * 1e3;

// rsc/streamable.tsx
function createStreamableUI(initialValue) {
  let currentValue = initialValue;
  let closed = false;
  let { row, resolve, reject } = createSuspensedChunk(initialValue);
  function assertStream(method) {
    if (closed) {
      throw new Error(method + ": UI stream is already closed.");
    }
  }
  let warningTimeout;
  function warnUnclosedStream() {
    if (process.env.NODE_ENV === "development") {
      if (warningTimeout) {
        clearTimeout(warningTimeout);
      }
      warningTimeout = setTimeout(() => {
        console.warn(
          "The streamable UI has been slow to update. This may be a bug or a performance issue or you forgot to call `.done()`.",
        );
      }, DEV_DEFAULT_STREAMABLE_WARNING_TIME);
    }
  }
  warnUnclosedStream();
  return {
    /**
     * The value of the streamable UI. This can be returned from a Server Action and received by the client.
     */
    value: row,
    /**
     * This method updates the current UI node. It takes a new UI node and replaces the old one.
     */
    update(value) {
      assertStream(".update()");
      if (value === currentValue) {
        warnUnclosedStream();
        return;
      }
      const resolvable = createResolvablePromise();
      currentValue = value;
      resolve({ value: currentValue, done: false, next: resolvable.promise });
      resolve = resolvable.resolve;
      reject = resolvable.reject;
      warnUnclosedStream();
    },
    /**
     * This method is used to append a new UI node to the end of the old one.
     * Once appended a new UI node, the previous UI node cannot be updated anymore.
     *
     * @example
     * ```jsx
     * const ui = createStreamableUI(<div>hello</div>)
     * ui.append(<div>world</div>)
     *
     * // The UI node will be:
     * // <>
     * //   <div>hello</div>
     * //   <div>world</div>
     * // </>
     * ```
     */
    append(value) {
      assertStream(".append()");
      const resolvable = createResolvablePromise();
      currentValue = value;
      resolve({ value, done: false, append: true, next: resolvable.promise });
      resolve = resolvable.resolve;
      reject = resolvable.reject;
      warnUnclosedStream();
    },
    /**
     * This method is used to signal that there is an error in the UI stream.
     * It will be thrown on the client side and caught by the nearest error boundary component.
     */
    error(error) {
      assertStream(".error()");
      if (warningTimeout) {
        clearTimeout(warningTimeout);
      }
      closed = true;
      reject(error);
    },
    /**
     * This method marks the UI node as finalized. You can either call it without any parameters or with a new UI node as the final state.
     * Once called, the UI node cannot be updated or appended anymore.
     *
     * This method is always **required** to be called, otherwise the response will be stuck in a loading state.
     */
    done(...args) {
      assertStream(".done()");
      if (warningTimeout) {
        clearTimeout(warningTimeout);
      }
      closed = true;
      if (args.length) {
        resolve({ value: args[0], done: true });
        return;
      }
      resolve({ value: currentValue, done: true });
    },
  };
}

export { createStreamableUI };
