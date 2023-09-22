import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { useRef, useState } from "react";
import { cn } from "~/utils/utils";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

export const Chat = ({ revisionId }: { revisionId: string }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);
  const reviseComponent = api.component.makeRevision.useMutation();
  const router = useRouter();

  // Submit the chat message when the user presses enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (formRef.current) formRef.current.requestSubmit();
    }
  };

  // Submit the revision
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const newRevisionId = await reviseComponent.mutateAsync({
      revisionId,
      prompt: input,
    });

    if (newRevisionId === null || newRevisionId.status === "error") {
      toast.error("Something went wrong while trying to revise the component");
      setLoading(false);
      return;
    }

    router.push(`/r/${newRevisionId.data.revisionId}`);
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="relative mb-3 flex w-full rounded-lg  border border-gray-300 bg-gray-200">
      <div className="relative min-w-0 flex-1">
        <form className="relative" onSubmit={handleSubmit} ref={formRef}>
          <div className="overflow-hidden rounded-lg bg-white  focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600">
            <label htmlFor="input" className="sr-only">
              Add your comment
            </label>
            <textarea
              rows={2}
              name="input"
              id="input"
              disabled={loading}
              className="block w-full resize-none border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
              placeholder="Describe the changes you would like to make"
              onKeyDown={handleKeyDown}
              onChange={handleInputChange}
            />

            {/* Spacer element to match the height of the toolbar */}
            <div className="py-2" aria-hidden="true">
              {/* Matches height of button in toolbar (1px border + 36px content height) */}
              <div className="py-px">
                <div className="h-9" />
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex justify-end py-2 pl-3 pr-2">
            <div className="flex-shrink-0">
              <button
                type="submit"
                disabled={loading}
                className={cn([
                  "inline-flex items-center rounded-md bg-indigo-600 px-2 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
                  loading && "cursor-not-allowed opacity-50",
                ])}
              >
                {loading ? (
                  <div className="h-4 w-4 stroke-gray-300">
                    <svg className="animate-spin" viewBox="0 0 256 256">
                      <line
                        x1="128"
                        y1="32"
                        x2="128"
                        y2="64"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="24"
                      ></line>
                      <line
                        x1="195.9"
                        y1="60.1"
                        x2="173.3"
                        y2="82.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="24"
                      ></line>
                      <line
                        x1="224"
                        y1="128"
                        x2="192"
                        y2="128"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="24"
                      ></line>
                      <line
                        x1="195.9"
                        y1="195.9"
                        x2="173.3"
                        y2="173.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="24"
                      ></line>
                      <line
                        x1="128"
                        y1="224"
                        x2="128"
                        y2="192"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="24"
                      ></line>
                      <line
                        x1="60.1"
                        y1="195.9"
                        x2="82.7"
                        y2="173.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="24"
                      ></line>
                      <line
                        x1="32"
                        y1="128"
                        x2="64"
                        y2="128"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="24"
                      ></line>
                      <line
                        x1="60.1"
                        y1="60.1"
                        x2="82.7"
                        y2="82.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="24"
                      ></line>
                    </svg>
                  </div>
                ) : (
                  <PaperAirplaneIcon className="h-4 w-4"></PaperAirplaneIcon>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
