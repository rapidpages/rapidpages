import { PromptTemplate } from "@langchain/core/prompts";
import {
  getComponentsList,
  formatComponentMetaShort,
} from "../components/index.js";
import { type GraphState, taskModel } from "../index.js";

const createTaskPromptTemplate = PromptTemplate.fromTemplate(`
You're a frontend engineer expert.
You have to generate a task for a junior frontend engineer to implement based on the user query.
Use existing components and icons from the UI library.

The user query is: {query}.

Existing components:
{components}
`);
export const makeCreateTaskNode = async (
  state: GraphState,
): Promise<Partial<GraphState>> => {
  const chain = createTaskPromptTemplate.pipe(taskModel);
  const task = await chain.invoke({
    query: state.input.query,
    components: getComponentsList(state.input.components || null, [])
      .map(formatComponentMetaShort)
      .join("\n"),
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
