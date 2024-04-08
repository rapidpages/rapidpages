import { type NextApiRequest, type NextApiResponse } from "next";
import * as ts from "typescript";

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  const body = request.body;

  const transformed = ts.transpileModule(body.code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: "react",
      jsxFactory: "createElement",
    },
  });

  return response.send(transformed.outputText);
};

export default handler;
