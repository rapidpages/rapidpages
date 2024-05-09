import { type ReactElement } from "react";
import { ApplicationLayout } from "~/components/AppLayout";
import { Button } from "~/components/Button";
import { signOut, useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { type NextPageWithLayout } from "./_app";
import { LoadingPage } from "~/components/LoadingPage";
import Image from "next/image";
import {
  type InferGetServerSidePropsType,
  type GetServerSidePropsContext,
} from "next";
import { ssgHelper } from "~/utils/ssg";
import { PlanStatus } from "@prisma/client";

const SettingsPage: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ plan, user }) => {
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
                  <dt className="text-sm font-medium text-gray-900">
                    Subscription Plan
                  </dt>
                  <dd className="mt-1 flex text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    <div className="grow">
                      <p className="font-bold">{plan.label}</p>
                      {plan.description ? <p>{plan.description}</p> : null}
                      {plan.type !== "free" ? (
                        <p>
                          You have{" "}
                          <span className="font-bold">{plan.credits}</span>
                          {plan.trial ? " free " : " "}credits left.
                        </p>
                      ) : null}
                      {plan.type !== "free" && !plan.trial && plan.renews ? (
                        <p>Renews on {plan.renews.toLocaleString()}</p>
                      ) : null}
                    </div>
                    {plan.type !== "free" && plan.trial ? (
                      <div className="flex basis-2/6 items-start justify-end">
                        <Button size="normal" onClick={() => {}}>
                          Upgrade
                        </Button>
                      </div>
                    ) : null}
                    {plan.type !== "free" && !plan.trial ? (
                      <div className="flex basis-2/6 items-start justify-end">
                        <Button size="normal" onClick={() => {}}>
                          Edit
                        </Button>
                      </div>
                    ) : null}
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
                        onClick={() => {
                          deleteUser.mutate();
                          signOut({
                            callbackUrl: `${window.location.origin}`,
                          });
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

  const planInfo = await ssg.user.getPlanOrCreate.fetch();

  const plan = {
    type: planInfo.plan.type,
    label: planInfo.plan.label,
    description: planInfo.plan.description,
    trial: planInfo.userPlan.status !== PlanStatus.ACTIVE,
    credits: planInfo.userPlan.credits,
    renews: new Date(),
  };

  return {
    props: {
      plan,
      user: session.user,
    },
  };
};

export default SettingsPage;
