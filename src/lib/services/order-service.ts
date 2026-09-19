import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, requireRole, type Actor } from "@/lib/rbac";
import {
  createOrderSchema,
  updateOrderSchema,
  type CreateOrderInput,
  type UpdateOrderInput,
} from "@/lib/validations/order";

// Mirrors client-service's scoping shape (spec section 4.2): Sales sees
// their own orders, other employee sub-roles see only orders with work
// currently assigned to them.
function orderScopeFor(actor: Actor): Prisma.OrderWhereInput {
  if (actor.role === "OWNER" || actor.role === "ADMIN") return {};
  if (actor.role !== "EMPLOYEE") return { id: "__none__" };

  if (actor.employeeRole === "SALES") return { salesOwnerId: actor.employeeId };
  if (actor.employeeRole === "SCRIPT_WRITER") {
    return { scripts: { some: { assignedToId: actor.employeeId } } };
  }
  if (actor.employeeRole === "SHOOT_MANAGER") {
    return { scripts: { some: { shoots: { some: { managerId: actor.employeeId } } } } };
  }
  if (actor.employeeRole === "EDITOR") {
    return { scripts: { some: { videos: { some: { editorId: actor.employeeId } } } } };
  }
  return { id: "__none__" };
}

function requireSalesWrite(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  if (actor.role === "EMPLOYEE" && actor.employeeRole !== "SALES") {
    throw new ForbiddenError("Only Sales employees can manage orders");
  }
}

export async function listOrders(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  return prisma.order.findMany({
    where: orderScopeFor(actor),
    include: { client: { select: { companyName: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function listOrdersForClient(actor: Actor, clientId: string) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  return prisma.order.findMany({
    where: { clientId, ...orderScopeFor(actor) },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrder(actor: Actor, id: string) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  const order = await prisma.order.findFirst({
    where: { id, ...orderScopeFor(actor) },
    include: { client: true },
  });
  if (!order) throw new ForbiddenError("Order not found or not accessible");
  return order;
}

// Spec section 4.2's "Live Production Counter": Ordered -> Assigned ->
// Completed -> Delivered -> Remaining Quota. Computed on read from Video
// rows every time, never stored, so it can't drift out of sync.
export async function getProductionCounter(actor: Actor, id: string) {
  const order = await getOrder(actor, id);
  const scope = { script: { orderId: order.id } } as const;

  const [assigned, completed, delivered] = await Promise.all([
    prisma.video.count({ where: scope }),
    prisma.video.count({ where: { ...scope, status: { in: ["FINAL_APPROVED", "DELIVERED"] } } }),
    prisma.video.count({ where: { ...scope, status: "DELIVERED" } }),
  ]);

  return {
    ordered: order.videoCount,
    assigned,
    completed,
    delivered,
    remaining: Math.max(order.videoCount - delivered, 0),
  };
}

function toDateOrNull(value?: string) {
  return value ? new Date(value) : null;
}

export async function createOrder(actor: Actor, input: CreateOrderInput) {
  requireSalesWrite(actor);
  const data = createOrderSchema.parse(input);

  const order = await prisma.order.create({
    data: {
      clientId: data.clientId,
      salesOwnerId: actor.employeeId ?? undefined,
      packageName: data.packageName,
      videoCount: data.videoCount,
      totalValue: data.totalValue,
      status: data.status,
      startDate: toDateOrNull(data.startDate),
      dueDate: toDateOrNull(data.dueDate),
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "ORDER_CREATED", entityType: "Order", entityId: order.id },
  });

  return order;
}

export async function updateOrder(actor: Actor, id: string, input: UpdateOrderInput) {
  requireSalesWrite(actor);
  const existing = await prisma.order.findFirst({ where: { id, ...orderScopeFor(actor) } });
  if (!existing) throw new ForbiddenError("Order not found or not accessible");

  const data = updateOrderSchema.parse(input);

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...(data.clientId !== undefined && { clientId: data.clientId }),
      ...(data.packageName !== undefined && { packageName: data.packageName }),
      ...(data.videoCount !== undefined && { videoCount: data.videoCount }),
      ...(data.totalValue !== undefined && { totalValue: data.totalValue }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.startDate !== undefined && { startDate: toDateOrNull(data.startDate) }),
      ...(data.dueDate !== undefined && { dueDate: toDateOrNull(data.dueDate) }),
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "ORDER_UPDATED", entityType: "Order", entityId: order.id },
  });

  return order;
}
