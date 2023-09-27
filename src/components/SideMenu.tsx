import { MegaphoneIcon } from "@heroicons/react/24/solid";
import { type ComponentRevision } from "@prisma/client";
import Link from "next/link";
import { formatDistance } from "date-fns";

export const SideMenu = ({ revisions }: { revisions: ComponentRevision[] }) => {
  // Sort revisions by createdAt date. This isn't an issue since the revision count is relatively small.
  const sortedRevisions = revisions.sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );

  return (
    <div className="flex h-full w-full flex-grow flex-col rounded-lg border border-gray-300 bg-gray-200">
      <div className="flex border-b border-gray-300 px-2 py-2.5">
        <div className="flex grow items-center justify-center truncate text-lg font-semibold">
          <span className="truncate">Revisions</span>
        </div>
      </div>

      <div className="flex grow flex-col px-2 pb-3 pt-6">
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {sortedRevisions.map((revision, revisionIdx) => (
              <li key={revision.id}>
                <div className="relative pb-8">
                  {revisionIdx !== revisions.length - 1 ? (
                    <span
                      className="absolute left-3 top-4 -ml-px h-full w-0.5 bg-gray-400"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="flex h-8 w-6 items-center justify-center rounded-full bg-gray-200">
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-400" />
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-2 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-500">{`Created ${formatDistance(
                          revision.createdAt,
                          new Date(),
                          { addSuffix: true },
                        )}`}</p>
                        <p
                          className="line-clamp-2 text-sm"
                          title={revision.prompt}
                        >
                          {revision.prompt}
                        </p>
                      </div>
                      <Link
                        className="whitespace-nowrap pr-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        href={`/r/${revision.id}`}
                      >
                        show
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col justify-end border-t border-gray-300 pb-2">
        <div className="flex gap-2 px-2 pt-2">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/rapidpages/rapidpages/blob/main/CHANGELOG.md"
            className="inline-flex flex-1 justify-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <MegaphoneIcon
              className="-ml-0.5 mr-1 h-5 w-5"
              aria-hidden="true"
            />
            <div className="">Changelog</div>
          </a>
        </div>
        <div className="flex gap-2 px-2 pt-2">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/rapidpages/rapidpages"
            className="inline-flex flex-1 justify-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <svg
              className="-ml-0.5 mr-1 h-5 w-5"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            <div className="">Github</div>
          </a>
        </div>
        <div className="flex gap-2 px-2 pt-2">
          <a
            className="inline-flex flex-1 justify-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            href="https://discord.gg/W6jYq46Frd"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              className="-ml-0.5 mr-1 h-5 w-5"
              viewBox="0 0 127.14 96.36"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
                clipRule="evenodd"
              />
            </svg>
            <div className="">Discord</div>
          </a>
        </div>
      </div>
    </div>
  );
};
