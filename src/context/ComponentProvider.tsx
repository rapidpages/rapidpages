import React, {
  createContext,
  useContext,
  useState,
} from "react";
import { type WithChildren } from "~/types/common";


interface Tab {
  name: string;
  sectionId: string;
  active: boolean;
}

type ComponentContextType = {
  // page: Page;
  tabs: Tab[];
  setActiveTab: (id?: string) => Promise<void>;
};

const ComponentContext = createContext<ComponentContextType | undefined>(
  undefined,
);

// Transforms the TSX code to JS

interface ProviderProps extends WithChildren {
  // site: Site;
}

// The provider for the ComponentContext
const ComponentProvider = ({ children }: ProviderProps) => {
  const [tabs] = useState<Tab[]>([]);

  return (
    <ComponentContext.Provider
      value={{
        tabs,
        setActiveTab: async () => {},
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
