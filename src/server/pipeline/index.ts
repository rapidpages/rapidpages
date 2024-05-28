/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import { StateGraph, MemorySaver, START, END } from "@langchain/langgraph";

function last<T>(arr?: T[]): T | undefined {
  return arr?.[arr.length - 1];
}

type Task = {
  name: string;
  description: string;
  suggestedIcons: string[];
  suggestedComponents: string[];
};

type BaseIteration = {
  index: number;
  task: Task;
};

type TodoIteration = BaseIteration & {
  status: "todo";
};

type CodeIteration = BaseIteration & {
  status: "coded";
  code: string;
};

type TestIteration = Omit<CodeIteration, "status"> & {
  status: "tested";
  errors?: string[];
};

type Iteration = TodoIteration | CodeIteration | TestIteration;

type GraphState = {
  input: {
    query: string;
    code?: string;
  };
  iterations?: Iteration[];
};

/**
 *       make-create-task
 *      ↑               ↓
 *  start               generate-code  →  test-code → end
 *      ↓               ↑          ↑       ↓
 *       make-update-task           fix-code
 **/

// Generates a new task for generating code from scratch
const MAKE_CREATE_TASK = "make-create-task";
// Generates a new task for updating existing code
const MAKE_UPDATE_TASK = "make-update-task";
// Generates a code from a task
const GENERATE_CODE = "generate-code";
// Tests the generated code
const TEST_CODE = "test-code";
// Generates a new task for fixing the code
const MAKE_FIX_TASK = "make-fix-task";

// Maximum number of fix iterations
const MAX_ALLOWED_FIX_ITERATIONS = 3;

type GraphNode =
  | typeof START
  | typeof END
  | typeof MAKE_CREATE_TASK
  | typeof MAKE_UPDATE_TASK
  | typeof GENERATE_CODE
  | typeof TEST_CODE
  | typeof MAKE_FIX_TASK;

const makeCreateTaskNode = (state: GraphState): Partial<GraphState> => {
  const todoIteration: TodoIteration = {
    index: state.iterations?.length || 0,
    status: "todo",
    task: {
      name: "create",
      description: "create task description",
      suggestedIcons: [],
      suggestedComponents: [],
    },
  };

  return {
    iterations: [...(state.iterations || []), todoIteration],
  };
};

const makeUpdateTaskNode = (state: GraphState): Partial<GraphState> => {
  const todoIteration: TodoIteration = {
    index: state.iterations?.length || 0,
    status: "todo",
    task: {
      name: "update",
      description: "update task description",
      suggestedIcons: [],
      suggestedComponents: [],
    },
  };

  return {
    iterations: [...(state.iterations || []), todoIteration],
  };
};

const generateCodeNode = (state: GraphState): Partial<GraphState> => {
  const iteration = last(state.iterations);
  if (!iteration || iteration.status !== "todo") {
    // or throw an error or something
    throw new Error("Invalid state");
  }

  return {
    iterations: [
      ...state.iterations!.slice(0, -1),
      {
        ...iteration,
        status: "coded",
        code: "some code",
      },
    ],
  };
};

const testCodeNode = (state: GraphState): Partial<GraphState> => {
  const iteration = last(state.iterations);
  if (!iteration || iteration.status !== "coded") {
    // or throw an error or something
    throw new Error("Invalid state");
  }

  if (state.iterations!.length < MAX_ALLOWED_FIX_ITERATIONS) {
    return {
      iterations: [
        ...state.iterations!.slice(0, -1),
        {
          ...iteration,
          status: "tested",
          errors: ["some error"],
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
      },
    ],
  };
};

const makeFixTaskNode = (state: GraphState): Partial<GraphState> => {
  const iteration = last(state.iterations);
  if (!iteration || iteration.status !== "tested") {
    // or throw an error or something
    throw new Error("Invalid state");
  }

  return {
    iterations: [
      ...state.iterations!,
      {
        index: state.iterations!.length,
        task: {
          ...iteration.task,
          // create a new task with the same description
          // and suggested components and icons
          // but with a new name
          name: `fix ${iteration.task.name}`,
        },
        status: "todo",
      },
    ],
  };
};

const testCodeEdge = (state: GraphState): GraphNode => {
  const iteration = last(state.iterations);
  if (!iteration || iteration.status !== "tested") {
    // or throw an error or something
    return END;
  }

  if (!iteration.errors || iteration.errors.length == 0) {
    return END;
  }

  // if we have more than 3 iterations, we should stop
  if (state.iterations!.length >= 3) {
    return END;
  }

  return MAKE_FIX_TASK;
};

const startEdge = (state: GraphState): GraphNode => {
  return state.input.code ? MAKE_UPDATE_TASK : MAKE_CREATE_TASK;
};

const workflow = new StateGraph<GraphState, Partial<GraphState>, GraphNode>({
  channels: {
    input: {
      value: (_, updated) => updated,
    },
    iterations: {
      value: (_, updated) => updated,
    },
  },
});

workflow.addNode<GraphNode>(MAKE_UPDATE_TASK, makeUpdateTaskNode);
workflow.addNode<GraphNode>(MAKE_CREATE_TASK, makeCreateTaskNode);
workflow.addNode<GraphNode>(GENERATE_CODE, generateCodeNode);
workflow.addNode<GraphNode>(TEST_CODE, testCodeNode);
workflow.addNode<GraphNode>(MAKE_FIX_TASK, makeFixTaskNode);

workflow.addConditionalEdges(START, startEdge);
workflow.addEdge(MAKE_CREATE_TASK, GENERATE_CODE);
workflow.addEdge(MAKE_UPDATE_TASK, GENERATE_CODE);
workflow.addEdge(GENERATE_CODE, TEST_CODE);
workflow.addConditionalEdges(TEST_CODE, testCodeEdge);
workflow.addEdge(MAKE_FIX_TASK, GENERATE_CODE);

const graph = workflow.compile({ checkpointer: new MemorySaver() });
const config = { configurable: { thread_id: "some-thread-id" } };

const invoke = async (input: GraphState) => {
  for await (const step of await graph.stream(
    {
      input,
    },
    { ...config, streamMode: "values" },
  )) {
    console.log(JSON.stringify(step, null, 2));
  }
};

const samples = [
  {
    input: {
      query:
        "generate a landing page for a browser extension chatbot. make it compelling and selling.",
    },
  },
  {
    input: {
      query:
        "update the landing page for a browser extension chatbot. make it compelling and selling.",
      code: "todo: some code",
    },
  },
];

for (const sample of samples) {
  invoke(sample);
}
