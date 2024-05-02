import vm from "node:vm";
import * as ts from "typescript";
import { type ReactNode, createElement } from "react";

// JSX is transformed to JSX_FACTORY_NAME() calls.
const JSX_FACTORY_NAME = "___$rs$jsx";

type ClientComponentId = string;
type ClientComponentBundlePath = string;
type ClientComponentNamedExportName = string;
// ClientComponentMetadata are used to fetch and mount the component on the client.
// Note for future reference:
//     it seems that newer version of `react-server-dom-webpack`
//     use an array format rather than objects:
//     [id, chunks, name, async]
type ClientComponentMetadata = {
  id: ClientComponentBundlePath;
  name: ClientComponentNamedExportName;
  chunks: [];
  async: true;
};

export type ClientComponentsWebpackManifest = Record<
  ClientComponentId,
  ClientComponentMetadata
>;

export type ClientComponent = {
  $$path: string;
  $$id: string;
};

export const transformJsx = (jsx: string): string =>
  ts.transpileModule(jsx, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      jsxFactory: JSX_FACTORY_NAME,
    },
  }).outputText;

const UnsupportedComponent = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return createElement("div", { className }, children);
};

export const evaluateReact = <ClientComponentsName extends string>(
  sourceCode: string,
  clientComponents: Record<ClientComponentsName, ClientComponent>,
  clientComponentsWebpackManifest: ClientComponentsWebpackManifest,
) => {
  const script = new vm.Script(sourceCode);

  const context = new Proxy(
    {
      [JSX_FACTORY_NAME]: createElement,
    },
    {
      get(target, prop, receiver) {
        if (typeof prop === "string" && /^[A-Z]/.test(prop)) {
          if (prop in clientComponents) {
            const component = clientComponents[prop as ClientComponentsName];

            if (component.$$id in clientComponentsWebpackManifest === false) {
              // @todo probably we can use ReactServerDOM.createClientModuleProxy(component.$$path)
              // revisit this part when implementing building for UI libraries / design systems.
              // [id, chunks, name, async]
              // clientComponentsWebpackManifest[t] = [`/g/test.js`, [], t, true];
              clientComponentsWebpackManifest[component.$$id] = {
                id: component.$$path,
                // Use the detected export name
                name: prop,
                // Turn off chunks. This is webpack-specific
                chunks: [],
                // Use an async import for the built resource in the browser
                async: true,
              };
            }

            return component;
          }

          // 1. The LLM has only streamed part of a supported component eg. <Compon
          // 2. The component is actually not supported eg. <NotSupported />
          return UnsupportedComponent;
        }

        return Reflect.get(target, prop, receiver);
      },
    },
  );

  // @todo check if this can be sandboxed further.
  vm.createContext(context);

  return script.runInContext(context);
};
