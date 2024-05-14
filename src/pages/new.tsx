import { useSession } from "next-auth/react";
import { useState, useEffect, type ReactElement, useRef } from "react";
import { ApplicationLayout } from "~/components/AppLayout";
import {
  ChevronRightIcon,
  CommandLineIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { type NextPageWithLayout } from "./_app";
import { Component } from "~/components/Component";
import { flushSync } from "react-dom";
import router from "next/router";
import { ComponentVisibility } from "@prisma/client";

type State =
  | {
      status: "idle";
      prompt: string;
    }
  | {
      status: "generate";
      prompt: string;
      code: {
        source: string;
        rsc: string;
      };
    }
  | {
      status: "error";
      prompt: string;
    };

const NewPage: NextPageWithLayout = () => {
  const { data: session } = useSession();
  const [state, setState] = useState<State>({ status: "idle", prompt: "" });

  const handleGenerateComponent = async (prompt: string) => {
    if (!session) {
      return router.push("/login");
    }

    if (state.status === "generate") return;

    flushSync(() => {
      setState({
        status: "generate",
        prompt,
        code: { source: "", rsc: "" },
      });
    });

    fetch("/api/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    })
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 403) {
            // Credits error
            setState({
              status: "error",
              prompt,
            });
            toast.error(response.statusText);
            return;
          }

          throw new Error(response.statusText);
        }

        const isStreaming =
          response.headers.get("content-type") === "text/plain";

        if (!isStreaming) {
          const { componentId } = await response.json();
          router.push(`/c/${componentId}`, undefined, { shallow: true });
          return;
        }

        // Preload the PageEditor so that it is ready to
        // use the RSC payload by the time we start to consume the stream
        // without dropping chunks.
        // Ideally the generation flow is refactored such that the PageEditor
        // and its underlying iframe are ready BEFORE we kick in a generation request.
        await import("~/components/PageEditor");

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No reader");
        }

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            return;
          }

          try {
            const data = decoder
              .decode(value)
              .split("$rschunk:")
              .slice(1)
              .map((chunk) => JSON.parse(chunk));

            data.forEach((data) => {
              if (data.error) {
                throw new Error(data.error);
              } else if (data.done) {
                flushSync(() => {
                  setState({
                    status: "generate",
                    code: data.code,
                    prompt,
                  });
                });
                // Similarly to previous versions,
                // router.push will reload and render the page.
                // Technically though the API could instead return
                // the component with its revisions to render
                // and we can just update the url with a native
                // history.pushState({}, "", `/c/${data.componentId}`)
                // The only cons of this would be that the Next.js router
                // won't pick up the history entry addition.
                router.push(`/c/${data.componentId}`);
              } else {
                flushSync(() => {
                  setState({
                    status: "generate",
                    code: data.code,
                    prompt,
                  });
                });
              }
            });
          } catch (error) {
            console.error(error);
          }
        }
      })
      .catch(() => {
        setState({
          status: "error",
          prompt,
        });
        toast.error("Failed to generate component");
        return;
      });
  };

  if (state.status === "generate") {
    return state.code.source ? (
      <Component
        component={{
          id: "",
          code: "",
          prompt: "",
          authorId: null,
          visibility: ComponentVisibility.PUBLIC,
          createdAt: new Date(),
          updatedAt: new Date(),
          revisions: [],
        }}
        code={state.code}
        revisionId={""}
        plan={null}
      />
    ) : (
      <Loading />
    );
  }

  return (
    <NewForm
      handleGenerateComponent={handleGenerateComponent}
      initialPrompt={state.prompt}
    />
  );
};

const items = [
  {
    name: "CTA for a landing page",
    description:
      "A section with a header text, subheader text and a CTA button with a link to a page. All centered. The background is a gradient from blue to purple. The text is white. The CTA button is purple.",
  },
  {
    name: "Features of a product",
    description:
      "A section with header text, subheader text, and a centered 2x2 grid to explain the features of the product. The background is gray colored, the text is colored white.",
  },
  {
    name: "Product Cards",
    description:
      "A section with a 2 product cards centered. Product cards with a product image, product name, product description, and a CTA button. The background is white, the text is black. The CTA button is purple.",
  },
];

const NewForm = ({
  initialPrompt = "",
  handleGenerateComponent,
}: {
  initialPrompt?: string;
  handleGenerateComponent: (prompt: string) => void;
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [input, setInput] = useState<string>(initialPrompt);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input === "") return;
    handleGenerateComponent(input);
  };

  return (
    <div className="flex h-full flex-grow flex-col">
      <div className="flex min-w-0 flex-grow bg-neutral-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <form onSubmit={handleSubmit} ref={formRef}>
            <div className="relative mx-5 my-64 flex items-center sm:mx-10 md:mx-32">
              <input
                type="text"
                className="block w-full rounded-md border-0 py-1.5 pr-14 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="A chat application panel with a header, a search input, and a list of recent conversations."
                onChange={handleInputChange}
                value={input}
              />
              <button
                type="submit"
                className="ml-1 inline-flex items-center rounded-md bg-indigo-600 px-2 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <PaperAirplaneIcon className="h-4 w-4"></PaperAirplaneIcon>
              </button>
            </div>
          </form>

          <h2 className="text-base font-semibold leading-6 text-gray-900">
            Need some inspiration?
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Checkout the following prompts to get started.
          </p>
          <ul
            role="list"
            className="mt-6 divide-y divide-gray-200 border-b border-t border-gray-200"
          >
            {items.map((item, itemIdx) => (
              <li key={itemIdx}>
                <div className="group relative flex items-start space-x-3 py-4">
                  <div className="flex-shrink-0">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500">
                      <CommandLineIcon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleGenerateComponent(item.description);
                        }}
                      >
                        <span className="absolute inset-0" aria-hidden="true" />
                        {item.name}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <div className="flex-shrink-0 self-center">
                    <ChevronRightIcon
                      className="h-5 w-5 text-gray-400 group-hover:text-gray-500"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex">
            {/* <Link
              href="#"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Or check what others have created
              <span aria-hidden="true"> &rarr;</span>
            </Link> */}
          </div>
        </div>
      </div>
    </div>
  );
};

const optimisticMessages = [
  "Processing Request",
  "Connecting to the AI",
  "Generating",
  "Almost ready",
  "Generating",
];

function Loading() {
  const [optimisticState, setOptimisticState] = useState(0);

  useEffect(() => {
    let tid;
    if (optimisticState < optimisticMessages.length - 1) {
      const stage = optimisticState + 1;
      tid = setTimeout(
        () => {
          setOptimisticState((state) => state + 1);
        },
        Math.random() * (stage * 1800 - stage * 800) + stage * 800,
      );
    }
    return () => {
      tid && clearTimeout(tid);
    };
  }, [optimisticState]);

  return (
    <div
      aria-live="polite"
      className="flex flex-col gap-8 items-center justify-center w-full h-full bg-gray-100"
    >
      <div className="space-y-2" aria-hidden="true">
        <div className="w-32 h-2 bg-gray-300 rounded animate-pulse" />
        <div className="w-40 h-2 bg-gray-300 rounded animate-pulse" />
        <div className="w-24 h-2 bg-gray-300 rounded animate-pulse" />
        <div className="w-36 h-2 bg-gray-300 rounded animate-pulse" />
      </div>
      <p className="text-gray-500 loading-ellipsis">
        {optimisticMessages[optimisticState]}
      </p>
    </div>
  );
}

NewPage.getLayout = (page: ReactElement) => (
  <ApplicationLayout title="Create a new component">{page}</ApplicationLayout>
);

export default NewPage;
