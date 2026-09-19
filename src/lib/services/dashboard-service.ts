import "server-only";
import { prisma } from "@/lib/prisma";
import type { Actor } from "@/lib/rbac";
import { listClients } from "@/lib/services/client-service";
import { listOrders } from "@/lib/services/order-service";
import { listScripts } from "@/lib/services/script-service";
import { listShoots } from "@/lib/services/shoot-service";
import { listVideos } from "@/lib/services/video-service";
import { listTasks } from "@/lib/services/task-service";

// The dashboard deliberately reuses the SAME scoped list*() functions every
// module page calls, rather than re-deriving scope rules here — so an
// Employee's dashboard numbers can never disagree with what their own list
// pages show, and role-branching (Sales sees their orders, Editor sees
// their videos, etc.) falls out for free. Only reachable by
// OWNER/ADMIN/EMPLOYEE — CLIENT is routed to the separate /portal dashboard
// by the (internal) layout before this is ever called.

async function getFinancialSummary() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const openStatuses = ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] as const;

  const [receivables, pendingInvoices, monthlyRevenue, monthlyExpenses, monthlyPayouts] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: { in: [...openStatuses] } },
      _sum: { amount: true, amountPaid: true },
    }),
    prisma.payment.count({ where: { status: { in: [...openStatuses] } } }),
    prisma.payment.aggregate({ where: { paidAt: { gte: startOfMonth } }, _sum: { amountPaid: true } }),
    prisma.expense.aggregate({ where: { incurredAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.creatorPayout.aggregate({
      where: { status: "PAID", paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
  ]);

  const totalReceivables = Number(receivables._sum.amount ?? 0) - Number(receivables._sum.amountPaid ?? 0);
  const monthlyRevenueTotal = Number(monthlyRevenue._sum.amountPaid ?? 0);
  const monthlyExpensesTotal = Number(monthlyExpenses._sum.amount ?? 0);
  const monthlyPayoutsTotal = Number(monthlyPayouts._sum.amount ?? 0);

  return {
    totalReceivables,
    pendingInvoices,
    monthlyRevenue: monthlyRevenueTotal,
    monthlyExpenses: monthlyExpensesTotal,
    creatorPayouts: monthlyPayoutsTotal,
    netProfit: monthlyRevenueTotal - monthlyExpensesTotal - monthlyPayoutsTotal,
  };
}

export async function getDashboardKpis(actor: Actor) {
  const [clients, orders, scripts, shoots, videos] = await Promise.all([
    listClients(actor),
    listOrders(actor),
    listScripts(actor),
    listShoots(actor),
    listVideos(actor),
  ]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const kpis = {
    totalActiveClients: clients.filter((c) => c.status === "ACTIVE").length,
    newClientsThisMonth: clients.filter((c) => c.createdAt >= startOfMonth).length,
    activeOrders: orders.filter((o) => o.status === "IN_PRODUCTION").length,
    pendingScripts: scripts.filter((s) => ["ASSIGNED", "IN_REVIEW", "SENT_TO_CLIENT"].includes(s.status)).length,
    upcomingShoots: shoots.filter((s) => s.scheduledAt >= now && ["SCHEDULED", "CONFIRMED"].includes(s.status))
      .length,
    videoPipeline: {
      inProduction: videos.filter((v) => ["RAW_FOOTAGE_RECEIVED", "VIDEO_EDITING", "INTERNAL_QA"].includes(v.status))
        .length,
      pendingApproval: videos.filter((v) => v.status === "CLIENT_REVIEW").length,
      underRevision: videos.filter((v) => v.status === "REVISION").length,
      delivered: videos.filter((v) => v.status === "DELIVERED").length,
    },
    financial: null as Awaited<ReturnType<typeof getFinancialSummary>> | null,
  };

  // Financial KPI cluster is Owner+Admin only (spec section 2) — Employees
  // get zero financial visibility, not just a scoped-down view of it.
  if (actor.role === "OWNER" || actor.role === "ADMIN") {
    kpis.financial = await getFinancialSummary();
  }

  return kpis;
}

export async function getDashboardWidgets(actor: Actor) {
  const [shoots, tasks, scripts, videos] = await Promise.all([
    listShoots(actor),
    listTasks(actor),
    listScripts(actor),
    listVideos(actor),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const activityFeed =
    actor.role === "OWNER" || actor.role === "ADMIN"
      ? await prisma.activityLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            profile: { select: { name: true } },
            client: { select: { companyName: true } },
          },
        })
      : [];

  return {
    todaysShoots: shoots.filter((s) => s.scheduledAt >= today && s.scheduledAt < tomorrow),
    urgentTasks: tasks.filter((t) => t.priority === "URGENT" && t.status !== "DONE"),
    overdueTasks: tasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== "DONE"),
    pendingScriptApprovals: scripts.filter((s) => s.status === "SENT_TO_CLIENT"),
    pendingClientVideoApprovals: videos.filter((v) => v.status === "CLIENT_REVIEW"),
    pendingEdits: videos.filter((v) => ["VIDEO_EDITING", "INTERNAL_QA"].includes(v.status)),
    activityFeed,
  };
}
