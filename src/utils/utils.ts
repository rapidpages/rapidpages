import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Escape a string for use in a regular expression
export const escapeRegExp = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

export function isModern(code: string) {
  return code.trim().startsWith("import") === false;
}

export function modernTemplate(code: string) {
  return `
import React from "react";

export default function Component() {
  return (
${code
  .split("\n")
  .map((line) => `    ${line}`)
  .join("\n")}
  );
}`;
}

export function createResolvablePromise<Result>() {
  let resolve: (value: Result) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reject: (reason?: any) => void = (reason) => {
    throw new Error(reason || "");
  };

  const promise = new Promise<Result>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    resolve,
    reject,
    promise,
  };
}
