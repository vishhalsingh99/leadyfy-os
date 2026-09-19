import "server-only";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, type Actor } from "@/lib/rbac";

function requireClient(actor: Actor): string {
  if (actor.role !== "CLIENT" || !actor.clientId) {
    throw new ForbiddenError("Client portal access only");
  }
  return actor.clientId;
}

// Deliberately hand-written, narrow `select`s rather than reusing the
// internal order-service — an allowlist of exactly what a client may see
// (order progress, video counts, invoices), never salesOwnerId, creator
// info, or internal cost breakdowns.
export async function listPortalOrders(actor: Actor) {
  const clientId = requireClient(actor);
  return prisma.order.findMany({
    where: { clientId },
    select: {
      id: true,
      packageName: true,
      videoCount: true,
      status: true,
      startDate: true,
      dueDate: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPortalOrder(actor: Actor, orderId: string) {
  const clientId = requireClient(actor);
  const order = await prisma.order.findFirst({
    where: { id: orderId, clientId },
    select: {
      id: true,
      packageName: true,
      videoCount: true,
      status: true,
      startDate: true,
      dueDate: true,
    },
  });
  if (!order) throw new ForbiddenError("Order not found or not accessible");

  const [assigned, delivered] = await Promise.all([
    prisma.video.count({ where: { script: { orderId } } }),
    prisma.video.count({ where: { script: { orderId }, status: "DELIVERED" } }),
  ]);

  return { ...order, videosAssigned: assigned, videosDelivered: delivered };
}
