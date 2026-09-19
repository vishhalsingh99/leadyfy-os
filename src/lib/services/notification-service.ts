import "server-only";
import { prisma } from "@/lib/prisma";
import type { Actor } from "@/lib/rbac";

// Notifications are always scoped to the actor's own profileId — there is
// no broader role check needed since a user can only ever see their own.
export async function listNotifications(actor: Actor) {
  return prisma.notification.findMany({
    where: { profileId: actor.profileId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function markAllNotificationsRead(actor: Actor) {
  await prisma.notification.updateMany({
    where: { profileId: actor.profileId, isRead: false },
    data: { isRead: true },
  });
}
