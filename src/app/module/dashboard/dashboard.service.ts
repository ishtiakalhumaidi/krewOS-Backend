import status from "http-status";
import { InviteStatus, PaymentStatus, SubscriptionPlan, UserRole } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

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

// 🌍 1. SUPER ADMIN: Global SaaS Health Stats
const getSuperAdminStatsData = async () => {
  const companyCount = await prisma.company.count();
  const userCount = await prisma.user.count({ where: { isActive: true } });
  const projectCount = await prisma.project.count();
  const paymentCount = await prisma.payment.count();

  // Total Lifetime Revenue
  const totalRevenue = await prisma.payment.aggregate({
    _sum: { amountCents: true },
    where: { status: PaymentStatus.SUCCEEDED },
  });

  // MRR (Monthly Recurring Revenue Estimation based on active PRO/ENTERPRISE plans)
  // Assuming a rough calculation: PRO = $49, ENTERPRISE = $159
  const activeSubscriptions = await prisma.subscription.groupBy({
    by: ["plan"],
    where: { cancelAtPeriodEnd: false },
    _count: { id: true },
  });

  let estimatedMRRCents = 0;
  activeSubscriptions.forEach((sub) => {
    if (sub.plan === SubscriptionPlan.PRO) estimatedMRRCents += sub._count.id * 4900;
    if (sub.plan === SubscriptionPlan.ENTERPRISE) estimatedMRRCents += sub._count.id * 15900;
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
    estimatedMRRCents,
    subscriptionDistribution: formattedSubscriptionDistribution,
  };
};

// 🏢 2. OWNER/ADMIN: Company-Wide Action Center
const getAdminStatsData = async (companyId: string) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscription: true },
  });

  const currentPlan = company?.subscription?.plan || SubscriptionPlan.FREE;

  const planConfig = await prisma.planConfig.findUnique({
    where: { tier: currentPlan },
  });

  // --- Project & User Metrics ---
  const totalProjects = await prisma.project.count({ where: { companyId } });
  const activeProjects = await prisma.project.count({ where: { companyId, status: "ACTIVE" } });

  const activeUsers = await prisma.user.count({ where: { companyId, isDeleted: false } });
  const pendingInvites = await prisma.invite.count({ where: { companyId, status: InviteStatus.PENDING } });
  const employeeCount = activeUsers + pendingInvites;

  // --- Action Center Metrics (Things requiring attention) ---
  
  // 👉 FIX: Only count unresolved incidents
  const unresolvedIncidentCount = await prisma.incident.count({
    where: { project: { companyId }, isResolved: false },
  });

  // 👉 NEW: Pending Material Requests needing approval
  const pendingMaterialRequests = await prisma.materialRequest.count({
    where: { project: { companyId }, status: "PENDING" }
  });

  // 👉 NEW: Today's Failed Safety Checklists
  const failedSafetyChecksToday = await prisma.safetyChecklist.findMany({
    where: {
      project: { companyId },
      allClear: false,
      checkDate: { gte: todayStart }
    },
    select: {
      id: true,
      checkDate: true,
      project: { select: { name: true } },
      submitter: { select: { name: true } }
    }
  });

  // --- Task Metrics ---
  const taskCount = await prisma.task.count({ where: { project: { companyId } } });
  const taskStatusDistribution = await prisma.task.groupBy({
    by: ["status"],
    where: { project: { companyId } },
    _count: { id: true },
  });

  const formattedTaskDistribution = taskStatusDistribution.map(
    ({ _count, status }) => ({ status, count: _count.id })
  );

  // --- Subscription Logic ---
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
    projectCount: totalProjects,
    activeProjects,
    employeeCount,
    taskCount,
    incidentCount: unresolvedIncidentCount, // Only unresolved
    pendingMaterialRequests, // Actionable item
    failedSafetyChecksToday, // Critical daily alert
    taskStatusDistribution: formattedTaskDistribution,
    subscriptionStats: {
      plan: currentPlan,
      projectsUsed: totalProjects,
      projectsLimit: planConfig?.maxProjects || 1,
      membersUsed: employeeCount,
      membersLimit: planConfig?.maxMembers || 5,
      daysRemaining,
      totalPeriodDays,
      currentPeriodEnd: periodEnd,
    }
  };
};

// 👷 3. MEMBER: Personal Workload & Accountability Stats
const getMemberStatsData = async (userId: string) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const next3Days = new Date();
  next3Days.setDate(next3Days.getDate() + 3);

  const myProjectCount = await prisma.projectMember.count({
    where: { userId },
  });

  const myTaskCount = await prisma.task.count({
    where: { assignedTo: userId },
  });

  // 👉 NEW: Overdue Tasks (Passed due date, not DONE)
  const overdueTasks = await prisma.task.count({
    where: { 
      assignedTo: userId, 
      status: { not: "DONE" },
      dueDate: { lt: new Date() }
    }
  });

  // 👉 NEW: Upcoming Deadlines (Due in next 3 days)
  const upcomingDeadlines = await prisma.task.findMany({
    where: {
      assignedTo: userId,
      status: { not: "DONE" },
      dueDate: { gte: new Date(), lte: next3Days }
    },
    select: { id: true, title: true, dueDate: true, project: { select: { name: true } } }
  });

  // 👉 NEW: Pending Material Requests I submitted
  const myPendingMaterials = await prisma.materialRequest.count({
    where: { requestedBy: userId, status: "PENDING" }
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
    overdueTasks, // Accountability metric
    upcomingDeadlines, // Actionable metric
    myPendingMaterials, // Are they waiting on approvals?
    myTaskStatusDistribution: formattedTaskDistribution,
  };
};

export const DashboardService = {
  getDashboardStatsData,
};