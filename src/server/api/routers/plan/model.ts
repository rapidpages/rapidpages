import {
  PlanStatus,
  type UserPlan,
  type PrismaClient,
  type User,
} from "@prisma/client";
import { plans, type PlanTypes } from "~/plans";

export async function create(
  db: PrismaClient,
  userId: User["id"],
  planConfig: PlanTypes,
) {
  return db.userPlan.create({
    data: {
      planId: planConfig.id,
      status: PlanStatus.UNPAID,
      credits: "credits" in planConfig ? planConfig.credits.free : undefined,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}

export function update(
  db: PrismaClient,
  userId: User["id"],
  data: Partial<UserPlan> = {},
) {
  return db.userPlan.update({
    where: {
      userId,
    },
    data,
  });
}

export async function getByUserId(db: PrismaClient, userId: User["id"]) {
  return db.userPlan.findUnique({
    where: {
      userId,
    },
  });
}

export async function getByUserIdWithPlanInfo(
  db: PrismaClient,
  userId: User["id"],
) {
  let userPlan = await getByUserId(db, userId);

  if (!userPlan) {
    return null;
  }

  const plan = plans.find((plan) => plan.id === userPlan!.planId);

  if (!plan) {
    return null;
  }

  /**
   * The logic below reloads the free credits every 30 days.
   *
   * It is not ideal to have this in here but at the same time
   * it is very convenient since when we feetch the user's plan information
   * we want to make sure that their credits balance is up to date.
   * The alternative would be to run this check everywhere the user credits are used or displayed.
   *
   * @todo figure out if we can find a better location for the free credits reload logic.
   */
  const now = Date.now();
  const shouldReloadFreeCredits =
    plan.type !== "free" &&
    userPlan.updatesAt == null &&
    now - userPlan.updatedAt.getTime() >=
      30.44 * 8.64e7; /* The average month length in milliseconds */

  if (shouldReloadFreeCredits) {
    userPlan = await update(db, userId, {
      credits: plan.credits.free,
      updatedAt: new Date(now),
    });
  }

  return {
    plan,
    userPlan,
  };
}

export async function getByCustomerId(
  db: PrismaClient,
  customerId: UserPlan["customerId"],
) {
  if (customerId == null) {
    return null;
  }

  return db.userPlan.findUnique({
    where: {
      customerId,
    },
  });
}

export async function getByCustomerIdWithPlanInfo(
  db: PrismaClient,
  customerId: UserPlan["customerId"],
) {
  const userPlan = await getByCustomerId(db, customerId);

  if (!userPlan) {
    return null;
  }

  const plan = plans.find((plan) => plan.id === userPlan.planId);

  if (!plan) {
    return null;
  }

  return {
    plan,
    userPlan,
  };
}

export class CreditsError extends Error {}

export async function consumeCredits(
  db: PrismaClient,
  operation: "create" | "edit",
  userId: User["id"],
) {
  const planInfo = await getByUserIdWithPlanInfo(db, userId);

  if (!planInfo) {
    throw new CreditsError("User plan not found please contact us");
  }

  const { userPlan, plan } = planInfo;

  if ("costs" in plan) {
    const creditsLeft = userPlan.credits - plan.costs[operation];

    if (creditsLeft < 0) {
      throw new CreditsError("Insufficient credits");
    }

    await db.userPlan.update({
      where: {
        id: userPlan.id,
      },
      data: {
        credits: creditsLeft,
      },
    });

    return {
      left: creditsLeft,
      used: plan.costs[operation],
    };
  }

  return {
    left: userPlan.credits,
    used: 0,
  };
}

export async function increaseCredits(
  db: PrismaClient,
  userId: User["id"],
  amount: number,
) {
  await db.userPlan.update({
    where: {
      userId,
    },
    data: {
      credits: {
        increment: amount,
      },
    },
  });
}
