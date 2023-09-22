import type { PropsWithChildren } from "react";

export type WithChildren<T = object> = T & PropsWithChildren<object>;

export type WithClassName<T = object> = T & {
  className?: string;
};
