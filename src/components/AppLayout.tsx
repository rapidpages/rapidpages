import { Fragment } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "~/utils/utils";
import { Logo } from "./LogoLarge";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { CustomToaster } from "~/components/CustomToaster";
import Head from "next/head";
import Image from "next/image";

const navigation = [{ name: "My UIs", href: "/my-uis" }];
const userNavigation = [{ name: "Settings", href: "/settings" }];
const PageNames = ["My UIs"];

interface ApplicationLayoutProps {
  page?: (typeof PageNames)[number];
  title?: string;
  children?: React.ReactNode;
}

export const ApplicationLayout = ({
  page,
  title,
  children,
}: ApplicationLayoutProps) => {
  const { data: session } = useSession();
  const user = session && session.user;

  return (
    <>
      {title && (
        <Head>
          <title>{title}</title>
        </Head>
      )}
      <Disclosure as="nav" className="border-b border-gray-200 bg-white">
        {({ open }) => (
          <>
            <div className="mx-auto px-8">
              <div className="flex h-16 justify-between">
                <div className="flex">
                  <Link
                    href="https://www.rapidpages.com"
                    className="flex flex-shrink-0 items-center"
                  >
                    <Logo className="block h-8 w-auto lg:hidden" />
                    <Logo className="hidden h-8 w-auto lg:block" />
                  </Link>
                  {session && (
                    <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            item.name === page
                              ? "border-indigo-500 text-gray-900"
                              : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium",
                          )}
                          aria-current={item.name === page ? "page" : undefined}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                {session && (
                  <div className="hidden sm:ml-6 sm:flex sm:items-center">
                    {/* Profile dropdown */}
                    <Menu as="div" className="relative ml-3">
                      <div>
                        <Menu.Button className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                          <span className="sr-only">Open user menu</span>
                          {user && user.image ? (
                            <img
                              className="h-8 w-8 rounded-full"
                              src={user.image}
                              alt=""
                            />
                          ) : (
                            <Image
                              className="h-8 w-8 rounded-full"
                              src="/images/person.jpg"
                              alt=""
                            />
                          )}
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          {userNavigation.map((item) => (
                            <Menu.Item key={item.name}>
                              {({ active }) => (
                                <a
                                  href={item.href}
                                  className={cn(
                                    active ? "bg-gray-100" : "",
                                    "block px-4 py-2 text-sm text-gray-700",
                                  )}
                                >
                                  {item.name}
                                </a>
                              )}
                            </Menu.Item>
                          ))}
                          <Menu.Item>
                            {({ active }) => (
                              <a
                                className={cn(
                                  active ? "bg-gray-100" : "",
                                  "block px-4 py-2 text-sm text-gray-700",
                                )}
                                href="#"
                                onClick={(event) => {
                                  event.preventDefault();
                                  signOut({
                                    callbackUrl: `${window.location.origin}/login`,
                                  });
                                }}
                              >
                                <span>Logout</span>
                              </a>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                )}

                {session && (
                  <div className="-mr-2 flex items-center sm:hidden">
                    {/* Mobile menu button */}
                    <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XMarkIcon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      ) : (
                        <Bars3Icon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      )}
                    </Disclosure.Button>
                  </div>
                )}
              </div>
            </div>
            <Disclosure.Panel className="sm:hidden">
              {session && (
                <div className="space-y-1 pb-3 pt-2">
                  {navigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as="a"
                      href={item.href}
                      className={cn(
                        item.name === page
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800",
                        "block border-l-4 py-2 pl-3 pr-4 text-base font-medium",
                      )}
                      aria-current={item.name === page ? "page" : undefined}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
              )}
              <div className="border-t border-gray-200 pb-3 pt-4">
                <div className="flex items-center px-4">
                  {user && (
                    <>
                      <div className="flex-shrink-0">
                        {user.image ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.image}
                            alt=""
                          />
                        ) : (
                          <Image
                            className="h-10 w-10 rounded-full"
                            src="/images/person.jpg"
                            alt=""
                          />
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">
                          {user.name}
                        </div>
                        <div className="text-sm font-medium text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-1">
                  {userNavigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      href={item.href}
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <main className="h-[calc(100vh-65px)]">{children}</main>
      <CustomToaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{ duration: 5000 }}
      />
    </>
  );
};
