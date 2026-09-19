import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, type Actor } from "@/lib/rbac";

function requireClient(actor: Actor): string {
  if (actor.role !== "CLIENT" || !actor.clientId) {
    throw new ForbiddenError("Client portal access only");
  }
  return actor.clientId;
}

export const createPortalTicketSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required"),
  message: z.string().trim().min(1, "Message is required"),
});

export async function listPortalTickets(actor: Actor) {
  const clientId = requireClient(actor);
  return prisma.supportTicket.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPortalTicket(actor: Actor, input: { subject: string; message: string }) {
  const clientId = requireClient(actor);
  const data = createPortalTicketSchema.parse(input);

  const ticket = await prisma.supportTicket.create({
    data: { clientId, subject: data.subject, message: data.message },
  });

  await prisma.activityLog.create({
    data: { clientId, action: "SUPPORT_TICKET_CREATED", entityType: "SupportTicket", entityId: ticket.id },
  });

  return ticket;
}
