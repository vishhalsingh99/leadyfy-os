import "server-only";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, requireRole, type Actor } from "@/lib/rbac";
import {
  createPaymentSchema,
  updatePaymentSchema,
  type CreatePaymentInput,
  type UpdatePaymentInput,
} from "@/lib/validations/payment";

// Financial ledger — Owner/Admin only, not scoped further (no Employee
// sub-role has any visibility into Payments per spec section 2).
function requireFinancialAccess(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN");
}

export async function listPayments(actor: Actor) {
  requireFinancialAccess(actor);
  return prisma.payment.findMany({
    include: { order: { include: { client: { select: { companyName: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPayment(actor: Actor, id: string) {
  requireFinancialAccess(actor);
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { order: { include: { client: true } } },
  });
  if (!payment) throw new ForbiddenError("Payment not found");
  return payment;
}

function toDateOrNull(value?: string) {
  return value ? new Date(value) : null;
}

export async function createPayment(actor: Actor, input: CreatePaymentInput) {
  requireFinancialAccess(actor);
  const data = createPaymentSchema.parse(input);

  const payment = await prisma.payment.create({
    data: {
      orderId: data.orderId,
      invoiceNumber: data.invoiceNumber,
      amount: data.amount,
      amountPaid: data.amountPaid,
      status: data.status,
      method: data.method || null,
      transactionRef: data.transactionRef || null,
      dueDate: toDateOrNull(data.dueDate),
      paidAt: toDateOrNull(data.paidAt),
      notes: data.notes || null,
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "PAYMENT_RECORDED", entityType: "Payment", entityId: payment.id },
  });

  return payment;
}

export async function updatePayment(actor: Actor, id: string, input: UpdatePaymentInput) {
  requireFinancialAccess(actor);
  const data = updatePaymentSchema.parse(input);

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      ...(data.orderId !== undefined && { orderId: data.orderId }),
      ...(data.invoiceNumber !== undefined && { invoiceNumber: data.invoiceNumber }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.amountPaid !== undefined && { amountPaid: data.amountPaid }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.method !== undefined && { method: data.method || null }),
      ...(data.transactionRef !== undefined && { transactionRef: data.transactionRef || null }),
      ...(data.dueDate !== undefined && { dueDate: toDateOrNull(data.dueDate) }),
      ...(data.paidAt !== undefined && { paidAt: toDateOrNull(data.paidAt) }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "PAYMENT_UPDATED", entityType: "Payment", entityId: payment.id },
  });

  return payment;
}
