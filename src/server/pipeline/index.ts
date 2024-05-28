/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import { StateGraph, MemorySaver, START, END } from "@langchain/langgraph";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

import samples from "./samples.json" assert { type: "json" };
import { compile } from "./lib/compile-code.js";
import { type ComponentsEnum, getComponentsList } from "./components/index.js";

function last<T>(arr?: T[]): T | undefined {
  return arr?.[arr.length - 1];
}

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

export type GraphState = {
  input: {
    query: string;
    components?: ComponentsEnum;
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

const model = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0,
});

const taskModel = model.withStructuredOutput(taskScheme, {
  name: "task",
});

const createTaskPromptTemplate = PromptTemplate.fromTemplate(`
You're a frontend engineer expert.
You have to generate a task for a junior frontend engineer to implement based on the user query.
Use existing components and icons from the UI library.

The user query is: {query}.

Existing components:
{components}
`);

const makeCreateTaskNode = async (
  state: GraphState,
): Promise<Partial<GraphState>> => {
  const chain = createTaskPromptTemplate.pipe(taskModel);
  const task = await chain.invoke({
    query: state.input.query,
    components: getComponentsList(state.input.components)
      .map((component) => `- ${component.name}: ${component.description}`)
      .join("\n"),
    // todo: add existing icons list
  });
  const todoIteration: TodoIteration = {
    index: state.iterations?.length || 0,
    status: "todo",
    task: task,
  };

  return {
    iterations: [...(state.iterations || []), todoIteration],
  };
};

const updateTaskPromptTemplate = PromptTemplate.fromTemplate(`
You're a frontend engineer expert.
You have to update the task for a junior frontend engineer to implement based on the user query.
Use existing components and icons from the UI library.

Existing code:
\`\`\`tsx
{code}
'\`\`\`

The user query is: {query}.

Existing components:
{components}
`);

const makeUpdateTaskNode = async (
  state: GraphState,
): Promise<Partial<GraphState>> => {
  const chain = updateTaskPromptTemplate.pipe(taskModel);

  const task = await chain.invoke({
    query: state.input.query,
    components: getComponentsList(state.input.components)
      .map((component) => `- ${component.name}: ${component.description}`)
      .join("\n"),
    code: state.input.code!,
  });

  const todoIteration: TodoIteration = {
    index: state.iterations?.length || 0,
    status: "todo",
    task: task,
  };

  return {
    iterations: [...(state.iterations || []), todoIteration],
  };
};

const generateCodePromptTemplate = PromptTemplate.fromTemplate(`
You're a frontend engineer and TypeScript, React, Tailwind expert.
- You have to generate UI code based on the task description.
- You may use only available components and icons from the UI library,
or generate components yourself from scratch.
- Don't use unknown imports or components.
- Don't use any external libraries.
- If you need to create multiple components, create them in separate files.
- Use tailwind to style the components.

The task description is:
{description}.

Available components:
{components}

Available icons:
{icons}

Your output code will be directly saved on the file and used on production,
so make sure it's correct, and try your best to make the UI perfect.
`);

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

const codeModel = model.withStructuredOutput(codeScheme, {
  name: "files",
});

const generateCodeNode = async (
  state: GraphState,
): Promise<Partial<GraphState>> => {
  const iteration = last(state.iterations);
  if (!iteration || iteration.status !== "todo") {
    // or throw an error or something
    throw new Error("Invalid state");
  }

  const chain = generateCodePromptTemplate.pipe(codeModel);

  const code = await chain.invoke({
    description: iteration.task.description,
    components: getComponentsList(state.input.components)
      .filter((component) =>
        iteration.task.suggestedComponents.includes(component.name),
      )
      .map(
        (component) =>
          `
1. ${component.name}
Description: ${component.description}
Usage example:
\`\`\`tsx
${component.docs.import.code}
${component.docs.use.map((use) => use.code).join("\n")}
\`\`\`

`,
      )
      .join("\n\n"),
    icons: "",
  });

  return {
    iterations: [
      ...state.iterations!.slice(0, -1),
      {
        ...iteration,
        status: "coded",
        code: code.files
          .map((file) => `//${file.name}\n${file.content}`)
          .join("\n\n"),
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
          errors: [],
        },
      ],
    };
  }

  const errors = compile([
    {
      name: "page.tsx",
      content: iteration.code,
    },
  ]);

  return {
    iterations: [
      ...state.iterations!.slice(0, -1),
      {
        ...iteration,
        status: "tested",
        errors,
      },
    ],
  };
};

const makeFixTaskPromptTemplate = PromptTemplate.fromTemplate(`
You're a frontend engineer expert.
You have to fix the code based on the errors.
Use existing components and icons from the UI library.

The errors are:
{errors}

Existing code:
\`\`\`tsx
{code}
'\`\`\`
`);

const makeFixTaskNode = async (
  state: GraphState,
): Promise<Partial<GraphState>> => {
  const iteration = last(state.iterations);
  if (
    !iteration ||
    iteration.status !== "tested" ||
    iteration.errors?.length == 0
  ) {
    // or throw an error or something
    throw new Error("Invalid state");
  }

  const chain = makeFixTaskPromptTemplate.pipe(codeModel);

  const fixedCode = await chain.invoke({
    errors: iteration.errors!.join("\n"),
    code: iteration.code,
  });

  return {
    iterations: [
      ...state.iterations!,
      {
        index: state.iterations!.length,
        task: iteration.task,
        status: "coded",
        code: fixedCode.files
          .map((file) => `//${file.name}\n${file.content}`)
          .join("\n\n"),
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
  .addNode<GraphNode>(MAKE_FIX_TASK, makeFixTaskNode)
  .addConditionalEdges(START, startEdge)
  .addEdge(MAKE_CREATE_TASK, GENERATE_CODE)
  .addEdge(MAKE_UPDATE_TASK, GENERATE_CODE)
  .addEdge(GENERATE_CODE, TEST_CODE)
  .addConditionalEdges(TEST_CODE, testCodeEdge)
  .addEdge(MAKE_FIX_TASK, GENERATE_CODE)
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
};

const createSample = samples[0] as GraphState["input"];
await invoke(createSample!);

// const updateSample = samples[1];
// await invoke(updateSample!);
