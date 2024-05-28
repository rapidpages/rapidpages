/* eslint-disable no-console */
import ts from "typescript";

const COMPILER_OPTIONS: ts.CompilerOptions = {
  noEmitOnError: true,
  noImplicitAny: true,
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS,
  jsx: ts.JsxEmit.ReactJSX,
};

export function compile(
  files: { name: string; content: string }[],
  options: ts.CompilerOptions = COMPILER_OPTIONS,
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

const testFile = `
//landing-page.tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="text-center py-10">
        <h1 className="text-4xl font-bold mb-4">
          Meet Your New Browser Extension Chatbot
        </h1>
        <p className="text-lg text-gray-700">
          Enhance your browsing experience with our AI-powered chatbot.
        </p>
        <Button className="mt-6" variant="solid">
          Download Now
        </Button>
      </header>

      <section className="my-10">
        <h2 className="text-3xl font-semibold mb-6 text-center">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature One</CardTitle>
              <CardDescription>
                Quick and easy access to information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Get instant answers to your questions without leaving your
                browser.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Feature Two</CardTitle>
              <CardDescription>Personalized recommendations.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Receive content tailored to your interests and browsing habits.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Feature Three</CardTitle>
              <CardDescription>Seamless integration.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Works with your favorite websites and tools.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="my-10">
        <h2 className="text-3xl font-semibold mb-6 text-center">Benefits</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="benefit-1">
            <AccordionTrigger>Save Time</AccordionTrigger>
            <AccordionContent>
              <p>
                Quickly find the information you need without sifting through
                search results.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="benefit-2">
            <AccordionTrigger>Stay Organized</AccordionTrigger>
            <AccordionContent>
              <p>Keep track of your tasks and reminders effortlessly.</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="benefit-3">
            <AccordionTrigger>Boost Productivity</AccordionTrigger>
            <AccordionContent>
              <p>Focus on what matters most with less distraction.</p>
            </AccordionItem>
        </Accordion>
      </section>

      <section className="my-10 text-center">
        <Alert>
          <AlertTitle>Don't Miss Out!</AlertTitle>
          <AlertDescription>
            Download the extension now and transform your browsing experience.
          </AlertDescription>
        </Alert>
        <Button className="mt-6" variant="solid">
          Download Now
        </Button>
      </section>
    </div>
  );
};

export default LandingPage;
`

const files = [{ name: "landing-page.tsx", content: testFile }];

// console.log(compile(files));