import { SubscriptionPlan } from "../../generated/prisma/enums";

export const PLAN_LIMITS = {
  [SubscriptionPlan.FREE]: {
    maxProjects: 1,
    maxMembers: 5,
    maxStorage: 100,
  },
  [SubscriptionPlan.PRO]: {
    maxProjects: 10,
    maxMembers: 50,
    maxStorage: 5000,
  },
  [SubscriptionPlan.ENTERPRISE]: {
    maxProjects: Infinity,
    maxMembers: Infinity,
    maxStorage: Infinity,
  },
};
