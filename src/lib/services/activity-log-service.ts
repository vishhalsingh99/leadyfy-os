import "server-only";
import { prisma } from "@/lib/prisma";
import { requireRole, type Actor } from "@/lib/rbac";

// ActivityLog only stores entityType + entityId (it has to stay generic
// across 12 different entity kinds), so the log itself has no human-
// readable label. Resolve one in a single batched query per entity type
// (not per row) — grouping first keeps this at "a handful of extra
// queries" instead of N+1 for a 100-row page.
async function resolveEntityLabels(logs: { entityType: string; entityId: string }[]) {
  const idsByType = new Map<string, Set<string>>();
  for (const log of logs) {
    if (!idsByType.has(log.entityType)) idsByType.set(log.entityType, new Set());
    idsByType.get(log.entityType)!.add(log.entityId);
  }

  const labels = new Map<string, string>();
  const setLabel = (entityType: string, id: string, label: string) => labels.set(`${entityType}:${id}`, label);

  await Promise.all(
    Array.from(idsByType.entries()).map(async ([entityType, idSet]) => {
      const ids = Array.from(idSet);
      switch (entityType) {
        case "Client": {
          const rows = await prisma.client.findMany({ where: { id: { in: ids } }, select: { id: true, companyName: true } });
          rows.forEach((r) => setLabel(entityType, r.id, r.companyName));
          break;
        }
        case "Order": {
          const rows = await prisma.order.findMany({ where: { id: { in: ids } }, select: { id: true, packageName: true } });
          rows.forEach((r) => setLabel(entityType, r.id, r.packageName));
          break;
        }
        case "Script": {
          const rows = await prisma.script.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } });
          rows.forEach((r) => setLabel(entityType, r.id, r.title));
          break;
        }
        case "Creator": {
          const rows = await prisma.creator.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
          rows.forEach((r) => setLabel(entityType, r.id, r.name));
          break;
        }
        case "Shoot": {
          const rows = await prisma.shoot.findMany({
            where: { id: { in: ids } },
            select: { id: true, scheduledAt: true, creator: { select: { name: true } } },
          });
          rows.forEach((r) => setLabel(entityType, r.id, `${r.creator.name} · ${r.scheduledAt.toLocaleDateString()}`));
          break;
        }
        case "Video": {
          const rows = await prisma.video.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } });
          rows.forEach((r) => setLabel(entityType, r.id, r.title));
          break;
        }
        case "Task": {
          const rows = await prisma.task.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } });
          rows.forEach((r) => setLabel(entityType, r.id, r.title));
          break;
        }
        case "Payment": {
          const rows = await prisma.payment.findMany({ where: { id: { in: ids } }, select: { id: true, invoiceNumber: true } });
          rows.forEach((r) => setLabel(entityType, r.id, r.invoiceNumber));
          break;
        }
        case "Expense": {
          const rows = await prisma.expense.findMany({
            where: { id: { in: ids } },
            select: { id: true, category: true, description: true },
          });
          rows.forEach((r) => setLabel(entityType, r.id, r.description ? `${r.category} — ${r.description}` : r.category));
          break;
        }
        case "CreatorPayout": {
          const rows = await prisma.creatorPayout.findMany({
            where: { id: { in: ids } },
            select: { id: true, creator: { select: { name: true } } },
          });
          rows.forEach((r) => setLabel(entityType, r.id, `Payout · ${r.creator.name}`));
          break;
        }
        case "SupportTicket": {
          const rows = await prisma.supportTicket.findMany({ where: { id: { in: ids } }, select: { id: true, subject: true } });
          rows.forEach((r) => setLabel(entityType, r.id, r.subject));
          break;
        }
        case "Profile": {
          const rows = await prisma.profile.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
          rows.forEach((r) => setLabel(entityType, r.id, r.name));
          break;
        }
        default:
          break;
      }
    }),
  );

  return labels;
}

export async function listActivityLogs(actor: Actor) {
  requireRole(actor, "OWNER");
  const logs = await prisma.activityLog.findMany({
    include: { profile: { select: { name: true } }, client: { select: { companyName: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const labels = await resolveEntityLabels(logs);

  // Falls back to the raw id only if the referenced row is gone (or an
  // entityType this resolver doesn't know about yet) — never silently
  // drops the row.
  return logs.map((log) => ({
    ...log,
    entityLabel: labels.get(`${log.entityType}:${log.entityId}`) ?? log.entityId,
  }));
}
