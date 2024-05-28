import shadCnComponents from "./shadcn/dump.json" assert { type: "json" };
import nextUIComponents from "./nextui/dump.json" assert { type: "json" };

export enum ComponentsEnum {
  ShadCn = "shadcn",
  NextUI = "nextui",
}
type ComponentMeta = {
  name: string;
  description: string;
  docs: {
    import: {
      code: string;
    };
    use: {
      code: string;
    }[];
    examples: {
      code: string;
    }[];
  };
};

export const formatComponentMetaShort = (component: ComponentMeta): string =>
  `- ${component.name}: ${component.description}`;

export const formatComponentMeta = (component: ComponentMeta): string => {
  const { name, description, docs } = component;
  return `## ${name}
${description}

usage:
\`\`\`tsx
${docs.import.code}
${docs.use.map((use) => use.code).join("\n")}
\`\`\`

examples:

${docs.examples
  .map(
    (example, index) => `
- example ${index}
\`\`\`tsx
${example.code}
\`\`\`
`,
  )
  .join("\n")}`;
};

export const getComponentsList = (
  components: ComponentsEnum | null,
  filterByNames: string[],
): ComponentMeta[] => {
  switch (components) {
    case "shadcn":
      return shadCnComponents.filter(
        (component) => 
          !filterByNames.length || filterByNames.includes(component.name),
      );
    case "nextui":
      return nextUIComponents.filter(
        (component) => 
          !filterByNames.length || filterByNames.includes(component.name),
      );
  }

  return [];
};
