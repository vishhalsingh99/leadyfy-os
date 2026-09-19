import "server-only";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, type Actor } from "@/lib/rbac";
import { canTransitionScript } from "@/lib/workflow/script-workflow";

function requireClient(actor: Actor): string {
  if (actor.role !== "CLIENT" || !actor.clientId) {
    throw new ForbiddenError("Client portal access only");
  }
  return actor.clientId;
}

// Narrow allowlist select — a client never sees assignedToId (which writer),
// internal deadlines are fine to show, but nothing about who's working on it.
const PORTAL_SCRIPT_SELECT = {
  id: true,
  videoNumber: true,
  title: true,
  content: true,
  language: true,
  status: true,
  revisionCount: true,
  orderId: true,
} as const;

export async function listPortalScripts(actor: Actor) {
  const clientId = requireClient(actor);
  return prisma.script.findMany({
    where: { order: { clientId } },
    select: PORTAL_SCRIPT_SELECT,
    orderBy: { videoNumber: "asc" },
  });
}

export async function getPortalScript(actor: Actor, scriptId: string) {
  const clientId = requireClient(actor);
  const script = await prisma.script.findFirst({
    where: { id: scriptId, order: { clientId } },
    select: PORTAL_SCRIPT_SELECT,
  });
  if (!script) throw new ForbiddenError("Script not found or not accessible");
  return script;
}

// Spec section 5.1/7.1: client approve/reject with a timestamped audit
// entry. Scripts have no dedicated feedback table (unlike Video), so a
// revision-request comment is recorded on the ActivityLog entry itself.
async function transitionPortalScript(
  actor: Actor,
  scriptId: string,
  target: "APPROVED" | "REVISION_REQUIRED",
  comment?: string,
) {
  const clientId = requireClient(actor);
  const script = await prisma.script.findFirst({ where: { id: scriptId, order: { clientId } } });
  if (!script) throw new ForbiddenError("Script not found or not accessible");
  if (!canTransitionScript(script.status, target)) {
    throw new ForbiddenError(`Cannot move a script from ${script.status} to ${target}`);
  }

  const updated = await prisma.script.update({
    where: { id: scriptId },
    data: {
      status: target,
      revisionCount: target === "REVISION_REQUIRED" ? script.revisionCount + 1 : script.revisionCount,
    },
  });

  await prisma.activityLog.create({
    data: {
      clientId,
      action: `SCRIPT_${target}`,
      entityType: "Script",
      entityId: scriptId,
      metadata: { from: script.status, to: target, comment: comment ?? null },
    },
  });

  return updated;
}

export function approvePortalScript(actor: Actor, scriptId: string) {
  return transitionPortalScript(actor, scriptId, "APPROVED");
}

export function requestPortalScriptRevision(actor: Actor, scriptId: string, comment: string) {
  return transitionPortalScript(actor, scriptId, "REVISION_REQUIRED", comment);
}
