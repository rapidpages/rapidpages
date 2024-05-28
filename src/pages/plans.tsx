import { type ReactElement } from "react";
import { ApplicationLayout } from "~/components/AppLayout";
import { Button } from "~/components/Button";
import { api } from "~/utils/api";
import { type NextPageWithLayout } from "./_app";
import {
  type InferGetServerSidePropsType,
  type GetServerSidePropsContext,
} from "next";
import { ssgHelper } from "~/utils/ssg";
import toast from "react-hot-toast";
import { TRPCClientError } from "@trpc/client";
import { getStripe } from "~/utils/stripe/stripe-client";
import { type PlanTypes, plans } from "~/plans";
import { cn } from "~/utils/utils";
import { stripe } from "~/utils/stripe/config";
import type Stripe from "stripe";

type PlanDetails = {
  price: number | null;
  currency: string | null;
  interval?: Stripe.Price.Recurring["interval"];
};

const PlansPage: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ planId, plans, details }) => {
  const checkout = api.plan.createCheckoutSession.useMutation();
  const goToCustomerPortal = api.plan.createCustomerPortalLink.useMutation();

  return (
    <div className="h-full bg-neutral-100 py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            Rapidpages Plans
          </h1>
        </div>
      </header>
      <main>
        <div className="mx-4 md:mx-auto mt-6 md:flex max-w-7xl gap-8 sm:px-6 lg:px-8">
          {plans.map((plan) => {
            const isCurrentPlan = planId === plan.id;
            const planDetails = details[plan.id];

            const interval =
              planDetails && planDetails.interval
                ? ` / ${planDetails.interval}`
                : "";

            return (
              <div
                key={plan.id}
                className={cn(
                  "flex-1 mb-4 bg-white shadow rounded-lg border-2 border-transparent",
                  planId === plan.id
                    ? "border-indigo-600"
                    : "hover:border-indigo-400",
                )}
              >
                <div className="px-4 py-6 sm:px-6">
                  <h2 className="text-2xl font-semibold">
                    {plan.name}
                    {isCurrentPlan ? (
                      <span className="inline-block mx-1 font-normal text-sm opacity-60">
                        (active)
                      </span>
                    ) : null}
                  </h2>
                  {"description" in plan &&
                  typeof plan.description === "string" ? (
                    <p className="my-2 opacity-75">{plan.description}</p>
                  ) : null}
                  <p className="mt-8">Includes:</p>
                  <div className="border rounded-md mt-2 p-4 bg-indigo-400 text-white">
                    {(plan as PlanTypes).type !== "free-unlimited" ? (
                      <p>
                        <span className="font-semibold">{plan.credits}</span>{" "}
                        credits{interval}
                      </p>
                    ) : (
                      "Unlimited usage"
                    )}
                  </div>

                  {planDetails && planDetails.price !== null ? (
                    <p className="text-2xl mt-8 flex justify-center">
                      {planDetails.price}
                      {""} {planDetails.currency?.toUpperCase()}
                      {interval}
                    </p>
                  ) : null}

                  {planId !== null &&
                  isCurrentPlan &&
                  plan.type === "subscription" ? (
                    <div className="mt-4 pt-6 border-t flex justify-center">
                      <Button
                        className="min-w-[33%] justify-center"
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
                    </div>
                  ) : null}

                  {planId !== null &&
                  !isCurrentPlan &&
                  plan.type === "subscription" ? (
                    <div className="mt-4 pt-6 border-t flex justify-center">
                      <Button
                        className="min-w-[33%] justify-center"
                        onClick={async () => {
                          try {
                            const { success, data } =
                              await checkout.mutateAsync(plan.id);

                            if (!success) {
                              throw new Error();
                            }

                            const { sessionId } = data;
                            const stripe = await getStripe();
                            stripe?.redirectToCheckout({ sessionId });
                          } catch (error) {
                            toast.error(
                              error instanceof TRPCClientError
                                ? error.message
                                : "Something went wrong.",
                            );
                          }
                        }}
                      >
                        Subscribe
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

PlansPage.getLayout = (page: ReactElement) => (
  <ApplicationLayout title="Settings">{page}</ApplicationLayout>
);

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const { ssg, session } = await ssgHelper(context);

  let planId: number | null = null;

  if (session) {
    const { userPlan } = await ssg.user.getPlanOrCreate.fetch();
    planId = userPlan.planId;
  }

  const planDetails: Record<number, PlanDetails> = {};

  const availablePlans = await Promise.all(
    plans
      .filter(
        (plan) =>
          plan.id === planId || (plan.active && plan.visiblity === "public"),
      )
      .map(async (plan) => {
        if (plan.type === "subscription") {
          try {
            const price = await stripe.prices.retrieve(plan.stripe.priceId);

            if (price && price.active) {
              const details: PlanDetails = {
                // unit_amount is in cents?!
                price:
                  price.unit_amount !== null ? price.unit_amount / 100 : null,
                currency: price.currency,
              };

              if (price.recurring) {
                details.interval = price.recurring.interval;
              }

              planDetails[plan.id] = details;
            }
          } catch {}

          plan.stripe.priceId = "";
        } else if (plan.type === "free") {
          planDetails[plan.id] = {
            price: null,
            currency: null,
            interval: "month",
          };
        }

        return plan;
      }),
  );

  return {
    props: {
      planId,
      plans: availablePlans,
      details: planDetails,
    },
  };
};

export default PlansPage;
