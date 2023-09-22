import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/solid";
import { PageEditor } from "~/components/PageEditor";

export const PagePanel = ({ code }: { code: string }) => {
  return (
    <>
      <div className="flex flex-grow items-center gap-1 border-l border-r border-gray-300 bg-gray-200 px-1 pb-1">
        {/* <div className="flex min-w-0 flex-1 items-center justify-between rounded bg-gray-100 py-1 pl-2 pr-1">
          <span className="truncate text-sm font-semibold text-gray-900">
            {publicURL}
          </span>
          <a
            className="cursor-click disabled:hocus:bg-transparent disabled:hocus:text-gray-400 relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-black bg-opacity-0 fill-current font-bold text-black text-opacity-50 shadow-none hover:bg-opacity-5 focus:outline-none focus-visible:bg-opacity-5 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-gray-400"
            href={publicURL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ArrowTopRightOnSquareIcon className="h-6 w-6" />
          </a>
        </div> */}
      </div>
      <div className="relative flex h-full w-full rounded-b-lg border border-t-0 border-gray-300 bg-gray-200">
        <PageEditor code={code} />
      </div>
    </>
  );
};
