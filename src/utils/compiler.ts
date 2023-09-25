import { availablePresets, registerPreset, transform } from "@babel/standalone";
import {
  type TailwindConfig,
  createTailwindcss,
} from "@mhsdesign/jit-browser-tailwindcss";

registerPreset("tsx", {
  presets: [
    [availablePresets["typescript"], { allExtensions: true, isTSX: true }],
  ],
});

export const compileTypescript = async (code: string) => {
  const compiledComponent = babelCompile(code, `Section.tsx`);

  const app = `
      import React, { useEffect } from 'react';
      import { createRoot } from 'react-dom';
      import Section from './Section.tsx';

      const App = () => {
        return (
          <>
            <Section />
          </>
        )
      }

      createRoot(document.querySelector("#root")).render(<App />)
    `;

  // Transform the code from TSX to JS
  const output = babelCompile(app, "index.tsx");

  // Have CSS generated from Tailwind
  const tailwindConfig: TailwindConfig = {
    theme: {
      extend: {
        colors: {},
      },
    },
    // plugins: [typography]
  };

  const tailwindCss = createTailwindcss({ tailwindConfig });

  const css = await tailwindCss.generateStylesFromContent(
    `
      @tailwind base;
      @tailwind components;
      @tailwind utilities;
    `,
    [compiledComponent.code, output.code],
  );

  const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <style>${css}</style>
    </head>
    <body style="background-color:#fff">
      <div id="root"></div>
      <script crossorigin defer src="https://unpkg.com/react@18.2.0/umd/react.production.min.js"></script>
      <script crossorigin defer src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
      <script defer>window.addEventListener("DOMContentLoaded", () => {${[
        compiledComponent.code,
        output.code,
      ].join("\n")}});</script>
    </body>
  </html>
    `;

  return html;
};

// Transforms the TSX code to JS
const babelCompile = (code: string, filename: string) =>
  transform(code, {
    filename: filename,
    plugins: [
      [
        "transform-modules-umd",
        {
          globals: { react: "React", "react-dom": "ReactDOM" },
        },
      ],
    ],
    presets: ["tsx", "react"],
  });