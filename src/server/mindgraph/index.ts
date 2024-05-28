/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import { StateGraph, MemorySaver, START, END } from "@langchain/langgraph";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import last from "lodash.last";

import { samples } from "./samples.js";
import { type ComponentsEnum } from "./components/index.js";
import { makeCreateTaskNode } from "./nodes/make-create-task.js";
import { makeUpdateTaskNode } from "./nodes/make-update-task.js";
import { generateCodeNode } from "./nodes/generate-code.js";
import { testCodeNode } from "./nodes/test-code/index.js";
import { fixCodeNode } from "./nodes/fix-code.js";

const taskScheme = z.object({
  name: z.string().describe("Short name of the task"),
  description: z.string().describe("Description of the task"),
  suggestedComponents: z
    .array(z.string()) // todo: make enum
    .describe("Suggested components to use"),
  suggestedIcons: z.array(z.string()).describe("Suggested icons to use"),
});

type Task = z.infer<typeof taskScheme>;

type BaseIteration = {
  task: Task;
};

type PlanIteration = BaseIteration & {
  status: "planned";
};

type GenerateIteration = BaseIteration & {
  status: "generated";
  code: string;
};

type TestIteration = Omit<GenerateIteration, "status"> & {
  status: "tested";
  errors?: string[];
};

type FixIteration = Omit<GenerateIteration, "status"> & {
  status: "fixed";
};

type Iteration =
  | PlanIteration
  | GenerateIteration
  | TestIteration
  | FixIteration;

export type GraphState = {
  input: {
    query: string;
    components?: ComponentsEnum;
    code?: string;
  };
  iterations?: Iteration[];
};

// Generates a new task for generating code from scratch
const MAKE_CREATE_TASK = "make-create-task";
// Generates a new task for updating existing code
const MAKE_UPDATE_TASK = "make-update-task";
// Generates a code from a task
const GENERATE_CODE = "generate-code";
// Tests the generated code
const TEST_CODE = "test-code";
// Generates a new task for fixing the code
const FIX_CODE = "make-fix-task";

// Maximum number of fix iterations
export const MAX_ALLOWED_FIX_ITERATIONS = 3;

type GraphNode =
  | typeof START
  | typeof END
  | typeof MAKE_CREATE_TASK
  | typeof MAKE_UPDATE_TASK
  | typeof GENERATE_CODE
  | typeof TEST_CODE
  | typeof FIX_CODE;

const model = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0,
});

export const taskModel = model.withStructuredOutput(taskScheme, {
  name: "task",
});

const codeScheme = z.object({
  files: z.array(
    z.object({
      name: z
        .string()
        .describe("Name of the file including its extension in kebab case"),
      content: z.string().describe("Content of the file"),
    }),
  ),
});

export const codeModel = model.withStructuredOutput(codeScheme, {
  name: "files",
});

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

  return FIX_CODE;
};

const startEdge = (state: GraphState): GraphNode => {
  return state.input.code ? MAKE_UPDATE_TASK : MAKE_CREATE_TASK;
};

const workflow = new StateGraph<GraphState, Partial<GraphState>, GraphNode>({
  channels: {
    input: {
      value: (existing, updated) => updated ?? existing,
    },
    iterations: {
      value: (existing, updated) => updated ?? existing,
    },
  },
});

const graph = workflow
  .addNode<GraphNode>(MAKE_CREATE_TASK, makeCreateTaskNode)
  .addNode<GraphNode>(MAKE_UPDATE_TASK, makeUpdateTaskNode)
  .addNode<GraphNode>(GENERATE_CODE, generateCodeNode)
  .addNode<GraphNode>(TEST_CODE, testCodeNode)
  .addNode<GraphNode>(FIX_CODE, fixCodeNode)
  .addConditionalEdges(START, startEdge)
  .addEdge(MAKE_CREATE_TASK, GENERATE_CODE)
  .addEdge(MAKE_UPDATE_TASK, GENERATE_CODE)
  .addEdge(GENERATE_CODE, TEST_CODE)
  .addConditionalEdges(TEST_CODE, testCodeEdge)
  .addEdge(FIX_CODE, TEST_CODE)
  .compile({ checkpointer: new MemorySaver() });

const config = { configurable: { thread_id: "some-thread-id" } };

export const invoke = async (input: GraphState["input"]) => {
  let result: GraphState = { input };
  for await (const step of await graph.stream({ input } as GraphState, {
    ...config,
    streamMode: "values",
  })) {
    const state = step as GraphState;
    const lastStep = last(state.iterations);
    console.log(lastStep ?? state.input);
    result = state;
  }

  const lastStep = last(result.iterations);
  // @ts-ignore
  console.log(lastStep?.code);
};

