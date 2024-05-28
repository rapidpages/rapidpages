This is a code gen thought pipeline experiment.

## What?
- Iterative code gen thought flow using langgraph
- The idea is to use thought flow/graph to generate code or update existing code

```sh
     make-create-task
    ↑               ↓
start               generate-code  →  test-code → end
    ↓               ↑                    ↓↑
     make-update-task                  fix-code
```
### Mind graph nodes' description
1. `start`: depending on whether user is iterating on existing code or not, we end up on `make-create-task` or `make-update-task`
    - `make-create-task`: uses llm to iterate over user query to rephrase and add more details and make request look like a task to junior frontend engineer
    - `make-update-task`: uses llm to iterate over user query and existing code to generate a detailed task as it were passed to junior frontend engineer
2. `generate-code`: using llm generate a TypeScript, React, Tailwind + selected components library code based on the previous step task
3. `test-code`: using typescript sdk parse code for errors
    - `fix-code`: in case of any errors try to fix using another round of llm call, then pass back to `test-code` node. Number of fix/test iterations is configurable, default is 3.
4. `end`: generated code

## How to run?
Note: The code is not integrated with the rest of the project, and lives as a separate code module:

1. `samples.ts` contain example sample inputs
2. First, set openai api key: `export OPENAI_API_KEY=<your-api-key>`
3. Then run samples: `node --no-warnings --loader ts-node/esm samples.ts`
