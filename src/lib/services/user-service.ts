import "server-only";
import { prisma } from "@/lib/prisma";
import { requireRole, ForbiddenError, type Actor } from "@/lib/rbac";

// System-wide user/RBAC overview — Owner-only (spec section 2: "Access
// executive analytics, system logs, and RBAC configs" is Owner-exclusive).
export async function listProfiles(actor: Actor) {
  requireRole(actor, "OWNER");
  return prisma.profile.findMany({
    include: { employee: true, client: { select: { companyName: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function setProfileActive(actor: Actor, profileId: string, isActive: boolean) {
  requireRole(actor, "OWNER");
  if (profileId === actor.profileId) {
    throw new ForbiddenError("You cannot deactivate your own account");
  }

  const profile = await prisma.profile.update({ where: { id: profileId }, data: { isActive } });

  await prisma.activityLog.create({
    data: {
      profileId: actor.profileId,
      action: isActive ? "USER_REACTIVATED" : "USER_DEACTIVATED",
      entityType: "Profile",
      entityId: profileId,
    },
  });

  return profile;
}
