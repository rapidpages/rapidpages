import OpenAI from "openai";
import { OpenAIStream } from "ai";
import { env } from "~/env.mjs";
import { escapeRegExp } from "~/utils/utils";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});
const openaiModelName = "gpt-4-0613";

const extractFirstCodeBlock = (input: string) => {
  const pattern = /```(\w+)?\n([\s\S]+?)\n```/g;
  let matches;
  while ((matches = pattern.exec(input)) !== null) {
    const language = matches[1];
    const codeBlock = matches[2];
    if (language === undefined || language === "tsx" || language === "json") {
      return codeBlock as string;
    }
  }

  // console.log(input);
  throw new Error("No code block found in input");
};

const containsDiff = (message: string) => {
  return (
    message.includes("<<<<<<< ORIGINAL") &&
    message.includes(">>>>>>> UPDATED") &&
    message.includes("=======\n")
  );
};

const applyDiff = (code: string, diff: string) => {
  const regex = /<<<<<<< ORIGINAL\n(.*?)=======\n(.*?)>>>>>>> UPDATED/gs;

  let match;

  // debugger;
  while ((match = regex.exec(diff)) !== null) {
    const [, before, after] = match;

    // Convert match to a regex. We need to do this because
    // gpt returns the code with the tabs removed. The idea here is to
    // convert newlines to \s+ so that we catch even if the indentation
    // is different.
    // TODO: Before we replace, we can also check how indented the code is
    // and add the same indentation to the replacement.
    let regex = escapeRegExp(before!);
    regex = regex.replaceAll(/\r?\n/g, "\\s+");
    regex = regex.replaceAll(/\t/g, "");

    // Create the regex
    const replaceRegex = new RegExp(regex);

    // console.log(`Replacing $$$${replaceRegex}$$$ with $$$${after}$$$`);
    // console.log(`Code before: ${code}`);

    code = code.replace(replaceRegex, after!);
  }

  return code;
};

export async function reviseComponent(prompt: string, code: string) {
  const completion = await openai.chat.completions.create({
    model: openaiModelName,
    messages: [
      {
        role: "system",
        content: [
          "You are an AI programming assistant.",
          "Follow the user's requirements carefully & to the letter.",
          "You're working on a react component using typescript and tailwind.",
          "Don't introduce any new components or files.",
          "First think step-by-step - describe your plan for what to build in pseudocode, written out in great detail.",
          "You must format every code change with an *edit block* like this:",
          "```",
          "<<<<<<< ORIGINAL",
          "    # some comment",
          "    # Func to multiply",
          "    def mul(a,b)",
          "=======",
          "    # updated comment",
          "    # Function to add",
          "    def add(a,b):",
          ">>>>>>> UPDATED",
          "```",
          "There can be multiple code changes.",
          "Modify as few characters as possible and use as few characters as possible on the diff.",
          "Minimize any other prose.",
          "Keep your answers short and impersonal.",
          "Never create a new component or file.",
          `Always give answers by modifying the following code:\n\`\`\`tsx\n${code}\n\`\`\``,
        ].join("\n"),
      },
      {
        role: "user",
        content: `${prompt}`,
      },
    ],
    temperature: 0,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 2000,
    n: 1,
  });

  const choices = completion.choices;

  if (
    !choices ||
    choices.length === 0 ||
    !choices[0] ||
    !choices[0].message ||
    !choices[0].message.content
  ) {
    throw new Error("No choices returned from OpenAI");
  }

  const diff = choices[0].message.content;

  if (!containsDiff(diff)) {
    throw new Error("No diff found in message");
  }

  const newCode = applyDiff(code, diff);

  return newCode;
}

function getMessages(prompt: string) {
  return [
    {
      role: "system",
      content: [
        `You are a helpful assistant. You're tasked with creating a website section using exclusively JSX and tailwind.` +
          `Do not use any dependency or imports.` +
          `Do not use dynamic data. Use placeholders as data. Do not use props.` +
          `Be concise and only respond with valid JSX directly. Start with <div>`,
      ].join("\n"),
    } as const,
    {
      role: "user",
      content: [`Request:\n` + `\`\`\`\n${prompt}\n\`\`\``].join("\n"),
    } as const,
  ];
}

export async function generateStreaming(prompt: string) {
  const response = await openai.chat.completions.create({
    stream: true,
    model: openaiModelName,
    messages: getMessages(prompt),
    temperature: 0,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 2000,
    n: 1,
  });

  return OpenAIStream(response);
}

export async function generate(prompt: string) {
  const completion = await openai.chat.completions.create({
    model: openaiModelName,
    messages: getMessages(prompt),
    temperature: 0,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 2000,
    n: 1,
  });

  const choices = completion.choices;

  if (!choices || choices.length === 0 || !choices[0] || !choices[0].message) {
    throw new Error("No choices returned from OpenAI");
  }

  const result = choices[0].message.content || "";

  return result.replace(/^```(jsx)?/, "").replace(/```\s*$/, "");
}

export async function generateNewComponent(prompt: string) {
  const completion = await openai.chat.completions.create({
    model: openaiModelName,
    messages: [
      {
        role: "system",
        content: [
          "You are a helpful assistant.",
          "You're tasked with writing a react component using typescript and tailwind for a website.",
          "Only import React as a dependency.",
          "Be concise and only reply with code.",
        ].join("\n"),
      } as const,
      {
        role: "user",
        content: [
          `- Component Name: Section`,
          `- Component Description: ${prompt}\n`,
          `- Do not use libraries or imports other than React.`,
          `- Do not have any dynamic data. Use placeholders as data. Do not use props.`,
          `- Write only a single component.`,
        ].join("\n"),
      } as const,
    ],
    temperature: 0,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 2000,
    n: 1,
  });

  const choices = completion.choices;

  if (!choices || choices.length === 0 || !choices[0] || !choices[0].message) {
    throw new Error("No choices returned from OpenAI");
  }

  let result = choices[0].message.content || "";
  result = extractFirstCodeBlock(result);

  // console.log(result);
  return result;
}
