import last from "lodash.last";
import { compile } from "./compile-code.js";
import { type GraphState, MAX_ALLOWED_FIX_ITERATIONS } from "../../index.js";


export const testCodeNode = (state: GraphState): Partial<GraphState> => {
  const iteration = last(state.iterations);
  if (
    !iteration ||
    (iteration.status !== "generated" && iteration.status !== "fixed")
  ) {
    // or throw an error or something
    throw new Error("Invalid state");
  }

  if (state.iterations!.length > MAX_ALLOWED_FIX_ITERATIONS) {
    return {
      iterations: [
        ...state.iterations!.slice(0, -1),
        {
          ...iteration,
          status: "tested",
        },
      ],
    };
  }

  return {
    iterations: [
      ...state.iterations!.slice(0, -1),
      {
        ...iteration,
        status: "tested",
        errors: compile([
          {
            name: "page.tsx",
            content: iteration.code,
          },
        ]),
      },
    ],
  };
};

