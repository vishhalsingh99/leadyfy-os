import "server-only";
import { prisma } from "@/lib/prisma";
import { requireRole, type Actor } from "@/lib/rbac";

export async function listActivityLogs(actor: Actor) {
  requireRole(actor, "OWNER");
  return prisma.activityLog.findMany({
    include: { profile: { select: { name: true } }, client: { select: { companyName: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
