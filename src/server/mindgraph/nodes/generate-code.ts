import { PromptTemplate } from "@langchain/core/prompts";
import last from "lodash.last";
import { getComponentsList, formatComponentMeta } from "../components/index.js";
import { type GraphState, codeModel } from "../index.js";

const generateCodePromptTemplate = PromptTemplate.fromTemplate(`
You're a frontend engineer and TypeScript, React, Tailwind expert.
- You have to generate UI code based on the task description.
- You may use only available components and icons from the UI library,
or generate components yourself from scratch.
- Don't use unknown imports or components.
- Don't use any external libraries.
- If you need to create multiple components, create them in separate files.
- Use tailwind to style the components.
- If not existing code is provided, create a new file.

Existing code:
\`\`\`tsx
{code}
'\`\`\`

The task description is:
{description}.

Available components:
{components}

Available icons:
{icons}

Your output code will be directly saved on the file and used on production,
so make sure it's correct, and try your best to make the UI perfect.
`);
export const generateCodeNode = async (
  state: GraphState,
): Promise<Partial<GraphState>> => {
  const iteration = last(state.iterations);
  if (!iteration || iteration.status !== "planned") {
    // or throw an error or something
    throw new Error("Invalid state");
  }

  const chain = generateCodePromptTemplate.pipe(codeModel);
  const code = await chain.invoke({
    description: iteration.task.description,
    components: getComponentsList(
      state.input.components || null,
      iteration.task.suggestedComponents,
    )
      .map(formatComponentMeta)
      .join("\n"),
    icons: "",
    code: state.input.code || "",
  });

  return {
    iterations: [
      ...state.iterations!.slice(0, -1),
      {
        ...iteration,
        status: "generated",
        code: code.files
          .map((file) => `//${file.name}\n${file.content}`)
          .join("\n\n"),
      },
    ],
  };
};
