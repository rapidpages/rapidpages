import { PromptTemplate } from "@langchain/core/prompts";
import {
  getComponentsList,
  formatComponentMetaShort,
} from "../components/index.js";
import { type GraphState, taskModel } from "../index.js";

const updateTaskPromptTemplate = PromptTemplate.fromTemplate(`
You're a frontend engineer expert.
You have to update the task for a junior frontend engineer to implement based on the user query.
Use existing components and icons from the UI library as well as referenced in the existing code.

Existing code:
\`\`\`tsx
{code}
'\`\`\`

The user query is: {query}.

Existing components:
{components}
`);
export const makeUpdateTaskNode = async (
  state: GraphState,
): Promise<Partial<GraphState>> => {
  const chain = updateTaskPromptTemplate.pipe(taskModel);

  const task = await chain.invoke({
    query: state.input.query,
    components: getComponentsList(state.input.components || null, [])
      .map(formatComponentMetaShort)
      .join("\n"),
    code: state.input.code!,
  });

  return {
    iterations: [
      ...(state.iterations || []),
      {
        status: "planned",
        task: task,
      },
    ],
  };
};
