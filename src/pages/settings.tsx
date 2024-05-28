import { type ReactElement } from "react";
import { ApplicationLayout } from "~/components/AppLayout";
import { Button } from "~/components/Button";
import { signOut } from "next-auth/react";
import { api } from "~/utils/api";
import { type NextPageWithLayout } from "./_app";
import Image from "next/image";
import {
  type InferGetServerSidePropsType,
  type GetServerSidePropsContext,
} from "next";
import { ssgHelper } from "~/utils/ssg";
import { PlanStatus } from "@prisma/client";
import toast from "react-hot-toast";
import { TRPCClientError } from "@trpc/client";
import { type PlanTypes } from "~/plans";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const SettingsPage: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ plan, user }) => {
  const goToCustomerPortal = api.plan.createCustomerPortalLink.useMutation();

  const deleteUser = api.user.deleteUser.useMutation();

  return (
    <div className="h-full bg-neutral-100 py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            Settings
          </h1>
        </div>
      </header>
      <main>
        <div className="mx-auto mt-6 flex max-w-7xl flex-col gap-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="px-4 py-6 sm:px-6">
              <h3 className="text-base font-semibold leading-7 text-gray-900">
                Personal Settings
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                Personal details and settings.
              </p>
            </div>
            <div className="border-t border-gray-100">
              <dl className="divide-y divide-gray-100">
                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-900">
                    Full name
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    {user.name}
                  </dd>
                </div>
                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-900">Email</dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    {user.email}
                  </dd>
                </div>
                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-900">Photo</dt>
                  <dd className="mt-2 sm:col-span-2 sm:mt-0">
                    <div className="flex items-center gap-x-3">
                      {user.image ? (
                        <img
                          className="h-12 w-12 rounded-full"
                          src={user.image}
                          alt=""
                        />
                      ) : (
                        <Image
                          className="h-12 w-12 rounded-full"
                          src="/images/person.jpg"
                          width={48}
                          height={48}
                          alt=""
                        />
                      )}
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="mb-4 overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="px-4 py-6 sm:px-6">
              <h3 className="text-base font-semibold leading-7 text-gray-900">
                Account Settings
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                Account details and settings.
              </p>
            </div>
            <div className="border-t border-gray-100">
              <dl className="divide-y divide-gray-100">
                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-900">Plan</dt>
                  <dd className="mt-1 flex text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    <div className="grow">
                      <p className="font-bold">{plan.name}</p>
                      {"credits" in plan ? (
                        <p>
                          You have{" "}
                          <span className="font-bold">{plan.credits}</span>
                          {plan.type === "free" ? " free " : " "}credits left.
                        </p>
                      ) : null}
                      {plan.type !== "free-unlimited" && plan.updatesAt ? (
                        <p>
                          {plan.status === PlanStatus.WILL_CANCEL
                            ? "Will be cancelled"
                            : "Renews"}{" "}
                          on {plan.updatesAt.toLocaleString()}
                        </p>
                      ) : null}
                      {plan.status === PlanStatus.UNPAID ? (
                        <p className="text-red-500 mt-2 flex gap-2">
                          <ExclamationTriangleIcon
                            className="stroke-2"
                            style={{ flex: "0 0 1.3em" }}
                          />{" "}
                          <span className="flex-1">
                            The plan is not active either because of a failed
                            payment or techincal issues. Go to the Manage plan
                            page. If the issue persists feel free to contact us.
                          </span>
                        </p>
                      ) : null}
                    </div>
                    <div className="flex basis-2/6 items-start justify-end">
                      {plan.type === "subscription" ? (
                        <Button
                          size="normal"
                          className={
                            plan.status === PlanStatus.UNPAID
                              ? "bg-red-500"
                              : undefined
                          }
                          onClick={async () => {
                            try {
                              const { success, data } =
                                await goToCustomerPortal.mutateAsync();

                              if (!success) {
                                throw new Error();
                              }

                              const { url } = data;
                              window.location.assign(url);
                            } catch (error) {
                              toast.error(
                                error instanceof TRPCClientError
                                  ? error.message
                                  : "Something went wrong.",
                              );
                            }
                          }}
                        >
                          Manage
                        </Button>
                      ) : (
                        <Button href="/plans">Check Plans</Button>
                      )}
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
            <div className="border-t border-gray-100">
              <dl className="divide-y divide-gray-100">
                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-900">
                    Delete Account
                  </dt>
                  <dd className="mt-1 flex text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    <div className="grow">
                      No longer want to use our service? This action is not
                      reversible. All information related to this account will
                      be deleted permanently.
                    </div>
                    <div className="flex basis-2/6 items-start justify-end">
                      <Button
                        variant="white"
                        size="normal"
                        onClick={async () => {
                          try {
                            deleteUser.mutate();
                            signOut({
                              callbackUrl: `${window.location.origin}`,
                            });
                          } catch {
                            toast.error("Something went wrong");
                          }
                        }}
                        // className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-400"
                      >
                        Delete my account
                      </Button>
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

SettingsPage.getLayout = (page: ReactElement) => (
  <ApplicationLayout title="Settings">{page}</ApplicationLayout>
);

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const { ssg, session } = await ssgHelper(context);

  if (!session) {
    return {
      notFound: true,
    };
  }

  const { plan, userPlan } = await ssg.user.getPlanOrCreate.fetch();

  return {
    props: {
      plan: {
        type: plan.type as PlanTypes["type"],
        name: plan.name,
        description: "description" in plan ? plan.description : null,
        status: userPlan.status,
        updatesAt: userPlan.updatesAt,
        credits: userPlan.credits,
      },
      user: session.user,
    },
  };
};

export default SettingsPage;
