import { useState, type ReactElement, useMemo } from "react";
import { ApplicationLayout } from "~/components/AppLayout";
import { Button } from "~/components/Button";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { type NextPageWithLayout } from "./_app";
import { LoadingPage } from "~/components/LoadingPage";
import {
  type PaginationState,
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import Link from "next/link";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import { formatDistance } from "date-fns";
import { cn } from "~/utils/utils";

type Component = {
  id: string;
  prompt: string;
  createdAt: Date;
};
type fetchDataOptions = { pageIndex: number; pageSize: number };

const MyUIsPage: NextPageWithLayout = () => {
  const { data: session, status } = useSession({ required: true });
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const fetchDataOptions: fetchDataOptions = {
    pageIndex,
    pageSize,
  };
  const dataQuery = api.component.getMyComponents.useQuery(fetchDataOptions);

  const columnHelper = createColumnHelper<Component>();
  const columns = [
    columnHelper.accessor("prompt", {
      id: "prompt",
      cell: (props) => (
        <Link href={`/c/${props.row.original.id}`}>{props.getValue()}</Link>
      ),
      header: "Prompt",
      maxSize: 350,
    }),
    columnHelper.accessor("createdAt", {
      id: "date",
      cell: (props) => (
        <div className="">
          <Link href={`/c/${props.row.original.id}`}>
            {formatDistance(new Date(props.getValue()), new Date(), {
              addSuffix: true,
            })}
          </Link>
        </div>
      ),
      header: "Date",
      maxSize: 100,
    }),
    columnHelper.display({
      id: "actions",
      cell: (props) => (
        <div className="block">
          <Link href={`/c/${props.row.original.id}`}>
            <ChevronRightIcon className="w-4" />
          </Link>
        </div>
      ),
      maxSize: 5,
    }),
  ];
  const defaultData = useMemo(() => [], []);

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize],
  );

  const table = useReactTable({
    data: dataQuery.data?.data.rows ?? defaultData,
    columns,
    pageCount: dataQuery.data?.data.pageCount ?? -1,
    state: {
      pagination,
    },
    defaultColumn: {
      maxSize: 200,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const isSessionLoading = status === "loading";

  if (isSessionLoading || !session) {
    return <LoadingPage />;
  }

  return (
    <div className="h-full bg-neutral-100 py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            My UIs
          </h1>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        {/* All UIs */}
        <div className="mt-4 flex flex-col">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden border-b border-gray-200 shadow sm:rounded-lg">
                {/* Table */}
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <th
                              key={header.id}
                              colSpan={header.colSpan}
                              scope="col"
                              className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                              style={{ width: header.getSize() }}
                            >
                              {header.isPlaceholder ? null : (
                                <div>
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                                </div>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {table.getRowModel().rows.map((row) => {
                      return (
                        <tr key={row.id} className="hover:bg-gray-50">
                          {row.getVisibleCells().map((cell) => {
                            return (
                              <td
                                key={cell.id}
                                className="overflow-hidden text-ellipsis whitespace-nowrap px-6 py-4 text-sm text-gray-500"
                                style={{
                                  // width: cell.column.getSize(),
                                  maxWidth: cell.column.columnDef.maxSize,
                                }}
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between py-3">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              variant="white"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="white"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div className="flex items-baseline gap-x-2">
              <span className="text-sm text-gray-700">
                Page{" "}
                <span className="font-medium">
                  {table.getState().pagination.pageIndex + 1}
                </span>{" "}
                of <span className="font-medium">{table.getPageCount()}</span>
              </span>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  className={cn([
                    "inline-flex items-center border border-gray-300 bg-white font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                    "px-3 py-2 text-sm leading-4",
                    "rounded-l-md",
                  ])}
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">First</span>
                  <ChevronDoubleLeftIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </button>
                <button
                  className={cn([
                    "inline-flex items-center border border-gray-300 bg-white font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                    "px-3 py-2 text-sm leading-4",
                  ])}
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeftIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </button>
                <button
                  className={cn([
                    "inline-flex items-center border border-gray-300 bg-white font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                    "px-3 py-2 text-sm leading-4",
                  ])}
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRightIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </button>
                <button
                  className={cn([
                    "inline-flex items-center border border-gray-300 bg-white font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                    "px-3 py-2 text-sm leading-4",
                    "rounded-r-md",
                  ])}
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Last</span>
                  <ChevronDoubleRightIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

MyUIsPage.getLayout = (page: ReactElement) => (
  <ApplicationLayout page="My UIs" title="My UIs">
    {page}
  </ApplicationLayout>
);

export default MyUIsPage;
