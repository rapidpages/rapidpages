import { PlanStatus, type PrismaClient, type User } from "@prisma/client";
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

export async function getByUserId(db: PrismaClient, userId: User["id"]) {
  return db.userPlan.findUnique({
    where: {
      userId,
    },
  });
}

export class CreditsError extends Error {}

export async function consumeCredits(
  db: PrismaClient,
  operation: "create" | "edit",
  userId: User["id"],
) {
  const userPlan = await getByUserId(db, userId);

  if (!userPlan) {
    throw new CreditsError("User plan not found please contact us");
  }

  const plan = plans.find((plan) => plan.id === userPlan.planId);

  if (!plan) {
    throw new CreditsError("Plan not found please contact us");
  }

  if ("costs" in plan) {
    const remainingCredits = userPlan.credits - plan.costs[operation];

    if (remainingCredits < 0) {
      throw new CreditsError("Insufficient credits");
    }

    await db.userPlan.update({
      where: {
        id: userPlan.id,
      },
      data: {
        credits: remainingCredits,
      },
    });

    return remainingCredits;
  }

  return 0;
}
