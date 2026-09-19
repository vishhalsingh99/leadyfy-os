import "server-only";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, type Actor } from "@/lib/rbac";

function requireClient(actor: Actor): string {
  if (actor.role !== "CLIENT" || !actor.clientId) {
    throw new ForbiddenError("Client portal access only");
  }
  return actor.clientId;
}

// Invoice amounts are explicitly something the spec says a client sees
// (spec section 7.1: "Access final delivery links, invoices..."). No
// internal notes/transactionRef — those are for internal reconciliation.
export async function listPortalInvoices(actor: Actor) {
  const clientId = requireClient(actor);
  return prisma.payment.findMany({
    where: { order: { clientId } },
    select: {
      id: true,
      invoiceNumber: true,
      amount: true,
      amountPaid: true,
      status: true,
      dueDate: true,
      paidAt: true,
      order: { select: { packageName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
