import "server-only";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, requireRole, type Actor } from "@/lib/rbac";
import {
  createCreatorSchema,
  updateCreatorSchema,
  setAvailabilitySchema,
  type CreateCreatorInput,
  type UpdateCreatorInput,
} from "@/lib/validations/creator";

// Creators are a shared resource pool, not scoped to any one client/order —
// every internal role can see the roster (spec section 5.2: workload
// tracking to avoid double-booking only works if everyone sees the same
// pool). Money (ratePerVideo) is hidden for non-Owner/Admin/Shoot-Manager at
// the UI layer (see canViewCreatorRates in lib/permissions.ts), not by
// filtering rows here.
function requireShootManagerWrite(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  if (actor.role === "EMPLOYEE" && actor.employeeRole !== "SHOOT_MANAGER") {
    throw new ForbiddenError("Only Shoot Managers can manage creators");
  }
}

export async function listCreators(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  return prisma.creator.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getCreator(actor: Actor, id: string) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  const creator = await prisma.creator.findUnique({
    where: { id },
    include: { availability: { orderBy: { date: "asc" } } },
  });
  if (!creator) throw new ForbiddenError("Creator not found");
  return creator;
}

export async function createCreator(actor: Actor, input: CreateCreatorInput) {
  requireShootManagerWrite(actor);
  const data = createCreatorSchema.parse(input);

  const creator = await prisma.creator.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      city: data.city || null,
      languages: data.languages || null,
      niches: data.niches || null,
      ratePerVideo: data.ratePerVideo,
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "CREATOR_CREATED", entityType: "Creator", entityId: creator.id },
  });

  return creator;
}

export async function updateCreator(actor: Actor, id: string, input: UpdateCreatorInput) {
  requireShootManagerWrite(actor);
  const data = updateCreatorSchema.parse(input);

  const creator = await prisma.creator.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.city !== undefined && { city: data.city || null }),
      ...(data.languages !== undefined && { languages: data.languages || null }),
      ...(data.niches !== undefined && { niches: data.niches || null }),
      ...(data.ratePerVideo !== undefined && { ratePerVideo: data.ratePerVideo }),
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "CREATOR_UPDATED", entityType: "Creator", entityId: creator.id },
  });

  return creator;
}

// Quick-set affordance — one row at a time, upserted on the
// (creatorId, date) unique constraint.
export async function setCreatorAvailability(
  actor: Actor,
  creatorId: string,
  input: { date: string; status: string },
) {
  requireShootManagerWrite(actor);
  const data = setAvailabilitySchema.parse(input);
  const date = new Date(data.date);

  return prisma.creatorAvailability.upsert({
    where: { creatorId_date: { creatorId, date } },
    update: { status: data.status },
    create: { creatorId, date, status: data.status },
  });
}
