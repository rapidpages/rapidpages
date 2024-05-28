import { PromptTemplate } from "@langchain/core/prompts";
import last from "lodash.last";
import { getComponentsList, formatComponentMeta } from "../components/index.js";
import { type GraphState, codeModel } from "../index.js";

const fixCodePromptTemplate = PromptTemplate.fromTemplate(`
You're a frontend engineer expert.
You have to fix the code based on the errors.
Use existing components and icons from the UI library.

The errors are:
{errors}

Existing code:
\`\`\`tsx
{code}
'\`\`\`

Available components:
{components}
`);
export const fixCodeNode = async (
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

  const chain = fixCodePromptTemplate.pipe(codeModel);

  const fixedCode = await chain.invoke({
    errors: iteration.errors!.join("\n"),
    code: iteration.code,
    components: getComponentsList(
      state.input.components || null,
      iteration.task.suggestedComponents,
    )
      .map(formatComponentMeta)
      .join("\n"),
  });

  return {
    iterations: [
      ...state.iterations!,
      {
        task: iteration.task,
        status: "fixed",
        code: fixedCode.files
          .map((file) => `//${file.name}\n${file.content}`)
          .join("\n\n"),
      },
    ],
  };
};
