import "server-only";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, ConflictError, requireRole, type Actor } from "@/lib/rbac";
import {
  createCreatorPayoutSchema,
  updateCreatorPayoutSchema,
  type CreateCreatorPayoutInput,
  type UpdateCreatorPayoutInput,
} from "@/lib/validations/creator-payout";

function requireFinancialAccess(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN");
}

export async function listCreatorPayouts(actor: Actor) {
  requireFinancialAccess(actor);
  return prisma.creatorPayout.findMany({
    include: { creator: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCreatorPayout(actor: Actor, id: string) {
  requireFinancialAccess(actor);
  const payout = await prisma.creatorPayout.findUnique({
    where: { id },
    include: { creator: true },
  });
  if (!payout) throw new ForbiddenError("Creator payout not found");
  return payout;
}

function toDateOrNull(value?: string) {
  return value ? new Date(value) : null;
}

// Spec section 7.3: "Prevents double payment per completed shoot/video."
async function assertNoDuplicatePayout(shootId: string, excludePayoutId?: string) {
  const existing = await prisma.creatorPayout.findFirst({
    where: {
      shootId,
      status: { in: ["APPROVED", "PAID"] },
      ...(excludePayoutId && { id: { not: excludePayoutId } }),
    },
  });
  if (existing) {
    throw new ConflictError("This shoot already has an approved or paid payout");
  }
}

export async function createCreatorPayout(actor: Actor, input: CreateCreatorPayoutInput) {
  requireFinancialAccess(actor);
  const data = createCreatorPayoutSchema.parse(input);

  if (data.shootId && data.status !== "PENDING") {
    await assertNoDuplicatePayout(data.shootId);
  }

  const payout = await prisma.creatorPayout.create({
    data: {
      creatorId: data.creatorId,
      shootId: data.shootId || null,
      videoCount: data.videoCount,
      amount: data.amount,
      status: data.status,
      paidAt: toDateOrNull(data.paidAt),
      reference: data.reference || null,
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "CREATOR_PAYOUT_CREATED", entityType: "CreatorPayout", entityId: payout.id },
  });

  return payout;
}

export async function updateCreatorPayout(actor: Actor, id: string, input: UpdateCreatorPayoutInput) {
  requireFinancialAccess(actor);
  const existing = await prisma.creatorPayout.findUniqueOrThrow({ where: { id } });
  const data = updateCreatorPayoutSchema.parse(input);

  const nextShootId = data.shootId !== undefined ? data.shootId || null : existing.shootId;
  const nextStatus = data.status ?? existing.status;
  if (nextShootId && nextStatus !== "PENDING") {
    await assertNoDuplicatePayout(nextShootId, id);
  }

  const payout = await prisma.creatorPayout.update({
    where: { id },
    data: {
      ...(data.creatorId !== undefined && { creatorId: data.creatorId }),
      ...(data.shootId !== undefined && { shootId: data.shootId || null }),
      ...(data.videoCount !== undefined && { videoCount: data.videoCount }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.paidAt !== undefined && { paidAt: toDateOrNull(data.paidAt) }),
      ...(data.reference !== undefined && { reference: data.reference || null }),
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "CREATOR_PAYOUT_UPDATED", entityType: "CreatorPayout", entityId: payout.id },
  });

  return payout;
}
