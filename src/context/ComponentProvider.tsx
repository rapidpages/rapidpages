import React, {
  Context,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { availablePresets, registerPreset, transform } from "@babel/standalone";
import {
  type TailwindConfig,
  createTailwindcss,
} from "@mhsdesign/jit-browser-tailwindcss";
// import { type Section, type Site } from "@prisma/client";
// import { api } from "@/utils/api";
// import { stringToObject } from "@/utils/utils";

import { type WithChildren } from "~/types/common";
import { toast } from "react-hot-toast";

interface Page {
  title: string;
  favicon: string;
  metaDescription: string;
  metaSocialImage: string;
  // sections: Section[];
  pageSource: string;
}

interface Tab {
  name: string;
  sectionId: string;
  active: boolean;
}

type SidePanel =
  | { name: "SectionList" }
  | { name: "PageSettings" }
  | { name: "SectionSettings"; selectedSection: number };

type ComponentContextType = {
  // page: Page;
  tabs: Tab[];
  setActiveTab: (id?: string) => Promise<void>;
  // sidePanel: SidePanel;
  // setSidePanel: (sidePanel: SidePanel) => void;
  // recompile: () => Promise<void>;
  // addSection: (section: Section) => Promise<void>;
  // moveSection: (id: string, direction: "up" | "down") => Promise<void>;
  // removeSection: (id: string) => Promise<void>;
  // saveSite: () => Promise<void>;
  // addTab: (id: string) => Promise<void>;
  // removeTab: (id: string) => Promise<void>;
  // getPublicURL: () => string;
  // savePageMetadata: (page: Page) => Promise<void>;
};

const ComponentContext = createContext<ComponentContextType | undefined>(
  undefined,
);

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
// const compileSections = async (
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

interface ProviderProps extends WithChildren {
  // site: Site;
}

// The provider for the ComponentContext
// const ComponentProvider = ({ site, children }: ProviderProps) => {
const ComponentProvider = ({ children }: ProviderProps) => {
  // const saveSiteCall = api.site.saveSite.useMutation();
  // const savePageCall = api.site.savePage.useMutation();
  // const getDataCall = api.site.getPageWithData.useQuery(site.id);
  // const [page, setPage] = useState(initialPage);
  const [sidePanel, _setSidePanel] = useState<SidePanel>({
    name: "SectionList",
  });
  const [tabs, setTabs] = useState<Tab[]>([]);

  // useEffect(() => {
  //   registerPreset("tsx", {
  //     presets: [
  //       [availablePresets["typescript"], { allExtensions: true, isTSX: true }],
  //     ],
  //   });

  //   // By default we return an empty sections. Fix this
  //   const pageData = getDataCall.data;
  //   if (pageData) {
  //     if (!pageData.sections) {
  //       pageData.sections = [];
  //     }
  //   }

  //   setPage(getDataCall.data || initialPage);
  // }, [getDataCall.data]);

  // const internalSaveData = async (page: Page) =>
  //   savePageCall.mutateAsync({
  //     id: site.id,
  //     title: page.title,
  //     favicon: page.favicon,
  //     metaDescription: page.metaDescription,
  //     metaSocialImage: page.metaSocialImage,
  //     data: { sections: page.sections, pageSource: page.pageSource },
  //   });

  return (
    <ComponentContext.Provider
      value={{
        tabs,
        setActiveTab: async (id?: string) => {},
      }}
    >
      {children}
    </ComponentContext.Provider>
  );
};

function useComponentProvider() {
  const context = useContext(ComponentContext);
  if (context === undefined) {
    throw new Error(
      "useComponentProvider must be used within a ComponentProvider",
    );
  }
  return context;
}

export { ComponentProvider, useComponentProvider };
