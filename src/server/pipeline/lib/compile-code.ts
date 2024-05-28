/* eslint-disable no-console */
import ts from "typescript";

const compilerOptions: ts.CompilerOptions = {
  noEmitOnError: true,
  noImplicitAny: true,
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS,
  jsx: ts.JsxEmit.React,
};

export function compile(
  files: { name: string; content: string }[],
  options: ts.CompilerOptions = compilerOptions,
): string[] {
  const host = ts.createCompilerHost(options);
  const originalReadFile = host.readFile;
  host.readFile = (fileName) => {
    const file = files.find((file) => file.name === fileName);
    if (file) {
      return file.content;
    }

    return originalReadFile(fileName);
  };
  const fileNames = files.map((file) => file.name);
  const program = ts.createProgram(fileNames, options, host);
  // const program = ts.createProgram(["page.tsx"], options);
  const emitResult = program.emit();

  const formatDiagnostic = (diagnostic: ts.Diagnostic) => {
    if (diagnostic.file) {
      const { line, character } = ts.getLineAndCharacterOfPosition(
        diagnostic.file,
        diagnostic.start!,
      );
      const message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n",
      );
      return `${diagnostic.file.fileName} (${line + 1},${
        character + 1
      }): ${message}`;
    } else {
      return ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    }
  };

  const emitDiagnostics = emitResult.diagnostics;
  
  // const preEmitDiagnostics = ts.getPreEmitDiagnostics(program);
  // const allDiagnostics = [...preEmitDiagnostics, ...emitDiagnostics].map(
  //   formatDiagnostic,
  // );

  return emitDiagnostics
  .filter(
    (error) =>
      // note: ignore for now errors related to missing components import
        !error.messageText
          .toString()
          .startsWith("Cannot find module '@/components/ui") &&
          !error.messageText.toString().endsWith(`@types/react/index"' can only be default-imported using the 'esModuleInterop' flag`),
    )
    .map(formatDiagnostic);
}