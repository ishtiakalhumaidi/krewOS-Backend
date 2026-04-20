import status from "http-status";
import { InviteStatus, PaymentStatus, SubscriptionPlan, UserRole } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

// 👉 1. FIX: Changed `id` to `userId` to match your auth token payload
interface IRequestUser {
  userId: string; 
  email: string;
  role: UserRole;
  companyId: string;
}

// 🎯 Main Switch Function
const getDashboardStatsData = async (user: IRequestUser) => {
  let statsData;

  switch (user.role) {
    case UserRole.SUPER_ADMIN:
      statsData = await getSuperAdminStatsData();
      break;
    case UserRole.OWNER:
    case UserRole.ADMIN:
      statsData = await getAdminStatsData(user.companyId);
      break;
    case UserRole.MEMBER:
      // 👉 2. FIX: Pass user.userId instead of user.id
      statsData = await getMemberStatsData(user.userId); 
      break;
    default:
      throw new AppError(status.BAD_REQUEST, "Invalid user role");
  }

  return {
    role: user.role,
    ...statsData,
  };
};

// 🌍 1. SUPER ADMIN: Global Stats (All Companies)
const getSuperAdminStatsData = async () => {
  const companyCount = await prisma.company.count();
  
  const userCount = await prisma.user.count({ where: { isActive: true } }); 
  const projectCount = await prisma.project.count();
  const paymentCount = await prisma.payment.count();

  const totalRevenue = await prisma.payment.aggregate({
    _sum: { amountCents: true },
    where: {
      status: PaymentStatus.SUCCEEDED, 
    },
  });

  const subscriptionDistribution = await prisma.subscription.groupBy({
    by: ["plan"],
    _count: { id: true },
  });

  const formattedSubscriptionDistribution = subscriptionDistribution.map(
    ({ _count, plan }) => ({ plan, count: _count.id })
  );

  return {
    companyCount,
    userCount,
    projectCount,
    paymentCount,
    totalRevenueCents: totalRevenue._sum.amountCents || 0,
    subscriptionDistribution: formattedSubscriptionDistribution,
  };
};

// 🏢 2. OWNER/ADMIN: Company-Wide Stats
const getAdminStatsData = async (companyId: string) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscription: true },
  });

  const currentPlan = company?.subscription?.plan || SubscriptionPlan.FREE;

  // 2. Fetch the dynamic limits from the DB
  const planConfig = await prisma.planConfig.findUnique({
    where: { tier: currentPlan },
  });

  // 3. Calculate general counts
  const projectCount = await prisma.project.count({
    where: { companyId },
  });

  const activeUsers = await prisma.user.count({
    where: { companyId, isDeleted: false },
  });
  
  const pendingInvites = await prisma.invite.count({
    where: { companyId, status: InviteStatus.PENDING },
  });
  
  const employeeCount = activeUsers + pendingInvites;

  const taskCount = await prisma.task.count({
    where: { project: { companyId } },
  });

  const incidentCount = await prisma.incident.count({
    where: { project: { companyId } },
  });

  const taskStatusDistribution = await prisma.task.groupBy({
    by: ["status"],
    where: { project: { companyId } },
    _count: { id: true },
  });

  const formattedTaskDistribution = taskStatusDistribution.map(
    ({ _count, status }) => ({ status, count: _count.id })
  );

  // 4. Calculate Subscription Time Remaining
  let daysRemaining = null;
  let totalPeriodDays = null;
  const periodStart = company?.subscription?.currentPeriodStart;
  const periodEnd = company?.subscription?.currentPeriodEnd;

  if (periodStart && periodEnd) {
    const start = new Date(periodStart).getTime();
    const end = new Date(periodEnd).getTime();
    const now = Date.now();
    
    totalPeriodDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }

  return {
    projectCount,
    employeeCount,
    taskCount,
    incidentCount,
    taskStatusDistribution: formattedTaskDistribution,
    
    // 👉 NEW: Send quota and billing data to the frontend
    subscriptionStats: {
      plan: currentPlan,
      projectsUsed: projectCount,
      projectsLimit: planConfig?.maxProjects || 1,
      membersUsed: employeeCount,
      membersLimit: planConfig?.maxMembers || 5,
      daysRemaining,
      totalPeriodDays,
      currentPeriodEnd: periodEnd,
    }
  };
};

// 👷 3. MEMBER: Personal Workload Stats
const getMemberStatsData = async (userId: string) => {
  const myProjectCount = await prisma.projectMember.count({
    where: { userId },
  });

  const myTaskCount = await prisma.task.count({
    where: { assignedTo: userId },
  });

  const myIncidentCount = await prisma.incident.count({
    where: { reportedBy: userId },
  });

  const myTaskStatusDistribution = await prisma.task.groupBy({
    by: ["status"],
    where: { assignedTo: userId },
    _count: { id: true },
  });

  const formattedTaskDistribution = myTaskStatusDistribution.map(
    ({ _count, status }) => ({ status, count: _count.id })
  );

  return {
    myProjectCount,
    myTaskCount,
    myIncidentCount,
    myTaskStatusDistribution: formattedTaskDistribution,
  };
};

export const DashboardService = {
  getDashboardStatsData,
};