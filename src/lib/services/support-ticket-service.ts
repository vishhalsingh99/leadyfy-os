import "server-only";
import { prisma } from "@/lib/prisma";
import { requireRole, type Actor } from "@/lib/rbac";
import type { SupportTicketStatus } from "@prisma/client";

// Shared internal support queue — every internal role can see it (spec
// section 8: general operational support module), but only Owner/Admin
// resolve tickets.
export async function listSupportTickets(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  return prisma.supportTicket.findMany({
    include: { client: { select: { companyName: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateSupportTicketStatus(actor: Actor, id: string, status: SupportTicketStatus) {
  requireRole(actor, "OWNER", "ADMIN");
  const ticket = await prisma.supportTicket.update({ where: { id }, data: { status } });

  await prisma.activityLog.create({
    data: {
      profileId: actor.profileId,
      action: "SUPPORT_TICKET_STATUS_UPDATED",
      entityType: "SupportTicket",
      entityId: id,
      metadata: { status },
    },
  });

  return ticket;
}
