import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, ConflictError, requireRole, type Actor } from "@/lib/rbac";
import {
  createShootSchema,
  updateShootSchema,
  type CreateShootInput,
  type UpdateShootInput,
} from "@/lib/validations/shoot";

function shootScopeFor(actor: Actor): Prisma.ShootWhereInput {
  if (actor.role === "OWNER" || actor.role === "ADMIN") return {};
  if (actor.role !== "EMPLOYEE") return { id: "__none__" };

  if (actor.employeeRole === "SHOOT_MANAGER") return { managerId: actor.employeeId };
  if (actor.employeeRole === "SALES") return { script: { order: { salesOwnerId: actor.employeeId } } };
  if (actor.employeeRole === "SCRIPT_WRITER") return { script: { assignedToId: actor.employeeId } };
  if (actor.employeeRole === "EDITOR") {
    return { script: { videos: { some: { editorId: actor.employeeId } } } };
  }
  return { id: "__none__" };
}

function requireShootManagerWrite(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  if (actor.role === "EMPLOYEE" && actor.employeeRole !== "SHOOT_MANAGER") {
    throw new ForbiddenError("Only Shoot Managers can manage shoots");
  }
}

function dayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { gte: start, lt: end };
}

// The double-booking guard from spec section 5.2: a creator can't be
// scheduled on two active shoots the same day. Checked at booking time,
// not left to the UI to catch.
async function assertCreatorNotDoubleBooked(creatorId: string, scheduledAt: Date, excludeShootId?: string) {
  const conflict = await prisma.shoot.findFirst({
    where: {
      creatorId,
      scheduledAt: dayRange(scheduledAt),
      status: { notIn: ["CANCELLED"] },
      ...(excludeShootId && { id: { not: excludeShootId } }),
    },
  });
  if (conflict) {
    throw new ConflictError(
      `This creator already has a shoot scheduled on ${scheduledAt.toLocaleDateString()}`,
    );
  }
}

export async function listShoots(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  return prisma.shoot.findMany({
    where: shootScopeFor(actor),
    include: { script: { include: { order: { include: { client: true } } } }, creator: true },
    orderBy: { scheduledAt: "desc" },
  });
}

export async function getShoot(actor: Actor, id: string) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  const shoot = await prisma.shoot.findFirst({
    where: { id, ...shootScopeFor(actor) },
    include: { script: { include: { order: { include: { client: true } } } }, creator: true },
  });
  if (!shoot) throw new ForbiddenError("Shoot not found or not accessible");
  return shoot;
}

export async function createShoot(actor: Actor, input: CreateShootInput) {
  requireShootManagerWrite(actor);
  const data = createShootSchema.parse(input);
  const scheduledAt = new Date(data.scheduledAt);

  await assertCreatorNotDoubleBooked(data.creatorId, scheduledAt);

  const shoot = await prisma.shoot.create({
    data: {
      scriptId: data.scriptId,
      creatorId: data.creatorId,
      managerId: actor.employeeId ?? undefined,
      scheduledAt,
      location: data.location || null,
      notes: data.notes || null,
      status: data.status,
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "SHOOT_SCHEDULED", entityType: "Shoot", entityId: shoot.id },
  });

  return shoot;
}

export async function updateShoot(actor: Actor, id: string, input: UpdateShootInput) {
  requireShootManagerWrite(actor);
  const existing = await prisma.shoot.findFirst({ where: { id, ...shootScopeFor(actor) } });
  if (!existing) throw new ForbiddenError("Shoot not found or not accessible");

  const data = updateShootSchema.parse(input);

  const nextCreatorId = data.creatorId ?? existing.creatorId;
  const nextScheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : existing.scheduledAt;
  if (data.creatorId !== undefined || data.scheduledAt !== undefined) {
    await assertCreatorNotDoubleBooked(nextCreatorId, nextScheduledAt, id);
  }

  const shoot = await prisma.shoot.update({
    where: { id },
    data: {
      ...(data.scriptId !== undefined && { scriptId: data.scriptId }),
      ...(data.creatorId !== undefined && { creatorId: data.creatorId }),
      ...(data.scheduledAt !== undefined && { scheduledAt: nextScheduledAt }),
      ...(data.location !== undefined && { location: data.location || null }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "SHOOT_UPDATED", entityType: "Shoot", entityId: shoot.id },
  });

  return shoot;
}
