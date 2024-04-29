import { createElement, useState } from "react";

export function Counter({ children, initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);

  return createElement(
    "div",
    { className: "flex flex-col gap-2 items-center" },
    createElement("div", { className: "text-3xl font-mono" }, count),
    createElement(
      "button",
      {
        onClick: () => {
          setCount(count + 1);
        },
        className: "bg-white text-red-500 px-4 py-1 rounded-md active:scale-90",
      },
      "+",
    ),
    children,
  );
}

Counter.$$typeof = Symbol.for("react.client.reference");
Counter.$$id = "__client.Counter";
Counter.displayName = "Counter";
