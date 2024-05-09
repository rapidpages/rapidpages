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

type PlanFree = PlanCommon & { type: "free" };
type PlanRecurrent = PlanCommon & { type: "recurrent" } & PlanConfig;

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
  },
] as [PlanFree, PlanRecurrent];

export type PlanTypes = (typeof plans)[number];

export const defaultPlan = plans[1];
