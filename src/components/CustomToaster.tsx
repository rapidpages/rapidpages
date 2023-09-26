import { Transition } from "@headlessui/react";
import {
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Fragment } from "react";
import toast, { Toaster, type ToasterProps } from "react-hot-toast";

export const CustomToaster: React.FC<ToasterProps> = (props) => (
  <Toaster {...props}>
    {(t) => (
      <Transition
        appear
        show={t.visible}
        as={Fragment}
        enter="transform transition-all ease-out duration-150"
        enterFrom="opacity-0 translate-y-5"
        enterTo="opacity-100 translate-y-0"
        leave="transition-all ease-in duration-150 transform"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-5"
      >
        <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {t.type === "success" ? (
                  <CheckCircleIcon
                    className="h-6 w-6 text-green-400"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircleIcon
                    className="h-6 w-6 text-red-400"
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-gray-900">
                  {t.type === "success" ? "Success!" : "Error!"}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {t.message as string}
                </p>
              </div>
              <div className="ml-4 flex flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => toast.dismiss(t.id)}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    )}
  </Toaster>
);
