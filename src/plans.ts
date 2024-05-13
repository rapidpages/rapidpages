import type { Stripe } from "stripe";

type PlanCommon = {
  id: number;
  label: string;
  description?: string;
};

type PlanConfig = {
  costs: {
    create: number;
    edit: number;
  };
  credits: {
    load: number;
    free: number;
  };
};

type StripeInfo = {
  priceId: Stripe.Price["id"];
  mode: Stripe.Checkout.Session.Mode;
};

export type PlanFree = PlanCommon & { type: "free" };
export type PlanRecurrent = PlanCommon & {
  type: "recurrent";
  stripe: StripeInfo;
} & PlanConfig;

export const plans = [
  {
    id: 0,
    label: "Free Plan",
    type: "free",
  },
  {
    id: 1,
    label: "Pro Subscription",
    type: "recurrent",
    costs: {
      create: 3,
      edit: 2,
    },
    credits: {
      load: 100,
      free: 10,
    },
    stripe: {
      priceId: "",
      mode: "subscription",
    },
  },
] as [PlanFree, PlanRecurrent];

// @todo add runtime check on plan.stripe to make sure that it is configured correctly.

export type PlanTypes = (typeof plans)[number];

export const defaultPlan = plans[1];
