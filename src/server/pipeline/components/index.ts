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

export const getComponentsList = (
  components?: ComponentsEnum,
): ComponentMeta[] => {
  switch (components) {
    case "shadcn":
      return shadCnComponents;
    case "nextui":
      return nextUIComponents;
  }

  return [];
};
