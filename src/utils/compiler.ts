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

  const contentElements = document.querySelectorAll(
    "[data-dynamic-tailwind-css]",
  );

  const content = Array.from(contentElements).reduce(
    (carry, el) => carry + el.outerHTML,
    "",
  );

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

// Compiles the sections and returns the HTML
const compile = (code: string) => {
  const compiled = babelCompile(code, `component.tsx`).code;
};
//   page: Page,
//   url: string,
//   sections: Section[],
// ) => {
//   const compiledSections = [] as string[];
//   const sectionIds = {} as { [key: string]: number };
//   const imports = [] as string[];
//   const elements = [] as string[];

//   for (const section of sections) {
//     if (sectionIds[section.componentName] === undefined) {
//       sectionIds[section.componentName] = 0;
//     } else {
//       sectionIds[section.componentName]++;
//     }

//     const componentName =
//       sectionIds[section.componentName] === 0
//         ? section.componentName
//         : `${section.componentName}${sectionIds[section.componentName]}`;

//     const componentProperties = Object.entries(
//       stringToObject(section.properties),
//     )
//       .map(([key, value]) => {
//         if (typeof value === "string") {
//           return `${key}="${value}"`;
//         } else {
//           return `${key}={${JSON.stringify(value)}}`;
//         }
//       })
//       .join(" ");

//     const compiled = babelCompile(section.code, `${componentName}.tsx`).code;
//     compiledSections.push(compiled);
//     imports.push(`import ${componentName} from '${componentName}'`);
//     elements.push(`<${componentName} ${componentProperties}/>`);
//   }

//   const code = `
//       import React, { useEffect } from 'react';
//       import { createRoot } from 'react-dom';
//       ${imports.join("\n")}

//       const App = () => {
//         return (
//           <>
//              ${elements.join("\n")}
//           </>
//         )
//       }

//       createRoot(document.querySelector("#root")).render(<App />)
//     `;

//   // Transform the code from TSX to JS
//   const output = transform(code, {
//     filename: "index.tsx",
//     plugins: [
//       [
//         "transform-modules-umd",
//         {
//           globals: { react: "React", "react-dom": "ReactDOM" },
//         },
//       ],
//     ],
//     presets: ["tsx", "react"],
//   });

//   // Have CSS generated from Tailwind
//   const tailwindConfig: TailwindConfig = {
//     theme: {
//       extend: {
//         colors: {
//           primary: "#4b6bfb",
//           "primary-focus": "hsl(229 96% 57%)",
//           "primary-content": "hsl(243 100% 94%)",
//           secondary: "#7b92b2",
//           "secondary-focus": "hsl(215 26% 52%)",
//           "secondary-content": "hsl(216 13% 13%)",
//           accent: "#67cba0",
//           "accent-focus": "hsl(154 49% 53%)",
//           "accent-content": "hsl(151 21% 13%)",
//           neutral: "#181a2a",
//           "neutral-focus": "hsl(233 27% 6%)",
//           "neutral-content": "#edf2f7",
//           "base-100": "#ffffff",
//           "base-200": "hsl(0 0% 93%)",
//           "base-300": "hsl(0 0% 86%)",
//           "base-content": "#181a2a",
//         },
//       },
//     },
//     // plugins: [typography]
//   };

//   const tailwindCss = createTailwindcss({ tailwindConfig });

//   const contentElements = document.querySelectorAll(
//     "[data-dynamic-tailwind-css]",
//   );

//   const content = Array.from(contentElements).reduce(
//     (carry, el) => carry + el.outerHTML,
//     "",
//   );

//   const css = await tailwindCss.generateStylesFromContent(
//     `
//       @tailwind base;
//       @tailwind components;
//       @tailwind utilities;
//     `,
//     [...compiledSections, output.code],
//   );

//   const html = `<!DOCTYPE html>
//   <html lang="en">
//     <head>
//       <title>${page.title}</title>
//       <link rel="icon" type="image/x-icon" href="${page.favicon}">
//       <meta name="description" content="${page.metaDescription}">
//       <meta name="viewport" content="width=device-width">

//       <!-- Facebook Meta Tags -->
//       <meta property="og:url" content="${url}" />
//       <meta property="og:type" content="website" />
//       <meta
//         property="og:title"
//         content="${page.title}"
//       />
//       <meta
//         property="og:description"
//         content="${page.metaDescription}"
//       />
//       <meta property="og:image" content="${page.metaSocialImage}" />

//       <!-- Twitter Meta Tags -->
//       <meta name="twitter:card" content="summary_large_image" />
//       <meta
//         name="twitter:title"
//         content="${page.title}"
//       />
//       <meta
//         name="twitter:description"
//         content="${page.metaDescription}"
//       />
//       <meta name="twitter:image" content="${page.metaSocialImage}" />

//       <style>${css}</style>
//     </head>
//     <body style="background-color:#fff">
//       <div id="root"></div>
//       <script crossorigin defer src="https://unpkg.com/react@18.2.0/umd/react.production.min.js"></script>
//       <script crossorigin defer src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
//       <script defer>window.addEventListener("DOMContentLoaded", () => {${[
//         ...compiledSections,
//         output.code,
//       ].join("\n")}});</script>
//     </body>
//   </html>
//     `;

//   return html;
// };
