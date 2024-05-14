import type { Stripe } from "stripe";

type PlanId = number;

type PlanCommon = {
  id: PlanId;
  active: boolean;
  visiblity: "public" | "private";
  name: string;
  description?: string;
};

type StripeInfo = {
  priceId: Stripe.Price["id"];
  mode: Stripe.Checkout.Session.Mode;
};

export type PlanFree = PlanCommon & {
  type: "free";
  credits: number;
  costs: {
    create: number;
    edit: number;
  };
};

export type PlanFreeUnlimited = PlanCommon & {
  type: "free-unlimited";
};

export type PlanSubscription = PlanCommon & {
  type: "subscription";
  credits: number;
  costs: {
    create: number;
    edit: number;
  };
  stripe: StripeInfo;
  unsubscribeTo: PlanId;
};

export type PlanTypes = PlanFree | PlanFreeUnlimited | PlanSubscription;
export const plans = [
  {
    id: 0,
    active: true,
    visiblity: "public",
    name: "Free Plan",
    description: "Great for giving Rapidpages Designer a try.",
    type: "free",
    credits: 10,
    costs: {
      create: 3,
      edit: 2,
    },
  },
  {
    id: 1,
    active: true,
    visiblity: "public",
    name: "Pro Subscription",
    type: "subscription",
    description: "Perfect for those who want to explore.",
    credits: 100,
    costs: {
      create: 3,
      edit: 2,
    },
    stripe: {
      priceId: "",
      mode: "subscription",
    },
    unsubscribeTo: 0,
  },
] satisfies [PlanFree, PlanSubscription];

export const defaultPlan = plans[0];
