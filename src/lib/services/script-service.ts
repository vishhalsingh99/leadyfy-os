import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, requireRole, type Actor } from "@/lib/rbac";
import { canTransitionScript } from "@/lib/workflow/script-workflow";
import {
  createScriptSchema,
  updateScriptSchema,
  type CreateScriptInput,
  type UpdateScriptInput,
} from "@/lib/validations/script";

function scriptScopeFor(actor: Actor): Prisma.ScriptWhereInput {
  if (actor.role === "OWNER" || actor.role === "ADMIN") return {};
  if (actor.role !== "EMPLOYEE") return { id: "__none__" };

  if (actor.employeeRole === "SALES") return { order: { salesOwnerId: actor.employeeId } };
  if (actor.employeeRole === "SCRIPT_WRITER") return { assignedToId: actor.employeeId };
  if (actor.employeeRole === "SHOOT_MANAGER") {
    // Scripts they already have a shoot for (to keep managing it), PLUS the
    // booking backlog — approved scripts waiting to be shot — otherwise a
    // Shoot Manager could never pick up a script that doesn't have a shoot
    // yet, since that set would always be empty for brand-new work.
    return {
      OR: [
        { shoots: { some: { managerId: actor.employeeId } } },
        { status: { in: ["APPROVED", "READY_FOR_SHOOT"] } },
      ],
    };
  }
  if (actor.employeeRole === "EDITOR") {
    // Same reasoning as Shoot Manager above: scripts already tied to one of
    // their videos, PLUS any script that's had its shoot completed — the
    // backlog of raw footage waiting to enter post-production.
    return {
      OR: [
        { videos: { some: { editorId: actor.employeeId } } },
        { shoots: { some: { status: "COMPLETED" } } },
      ],
    };
  }
  return { id: "__none__" };
}

function requireWriterWrite(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  if (actor.role === "EMPLOYEE" && actor.employeeRole !== "SCRIPT_WRITER") {
    throw new ForbiddenError("Only Script Writers can manage scripts");
  }
}

export async function listScripts(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  return prisma.script.findMany({
    where: scriptScopeFor(actor),
    include: { order: { include: { client: { select: { companyName: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

// Small lookup for the assignee dropdown — not a full Employees module
// (that's Owner-only, later in Phase 5), just enough to populate a select.
export async function listScriptWriterOptions() {
  const writers = await prisma.employee.findMany({
    where: { employeeRole: "SCRIPT_WRITER" },
    include: { profile: { select: { name: true } } },
  });
  return writers.map((w) => ({ id: w.id, name: w.profile.name }));
}

export async function listScriptsForOrder(actor: Actor, orderId: string) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  return prisma.script.findMany({
    where: { orderId, ...scriptScopeFor(actor) },
    orderBy: { videoNumber: "asc" },
  });
}

export async function getScript(actor: Actor, id: string) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  const script = await prisma.script.findFirst({
    where: { id, ...scriptScopeFor(actor) },
    include: { order: { include: { client: true } } },
  });
  if (!script) throw new ForbiddenError("Script not found or not accessible");
  return script;
}

function toDateOrNull(value?: string) {
  return value ? new Date(value) : null;
}

export async function createScript(actor: Actor, input: CreateScriptInput) {
  requireWriterWrite(actor);
  const data = createScriptSchema.parse(input);

  const script = await prisma.script.create({
    data: {
      orderId: data.orderId,
      assignedToId: data.assignedToId || null,
      videoNumber: data.videoNumber,
      title: data.title,
      content: data.content,
      language: data.language,
      status: data.status,
      deadline: toDateOrNull(data.deadline),
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "SCRIPT_CREATED", entityType: "Script", entityId: script.id },
  });

  return script;
}

export async function updateScript(actor: Actor, id: string, input: UpdateScriptInput) {
  requireWriterWrite(actor);
  const existing = await prisma.script.findFirst({ where: { id, ...scriptScopeFor(actor) } });
  if (!existing) throw new ForbiddenError("Script not found or not accessible");

  const data = updateScriptSchema.parse(input);

  const script = await prisma.script.update({
    where: { id },
    data: {
      ...(data.orderId !== undefined && { orderId: data.orderId }),
      ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId || null }),
      ...(data.videoNumber !== undefined && { videoNumber: data.videoNumber }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.language !== undefined && { language: data.language }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.deadline !== undefined && { deadline: toDateOrNull(data.deadline) }),
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "SCRIPT_UPDATED", entityType: "Script", entityId: script.id },
  });

  return script;
}

// The state-enforced path (spec section 6.2): only moves listed in
// SCRIPT_TRANSITIONS are allowed, regardless of role — Owner/Admin do not
// bypass this, unlike requireEmployeeRole's role bypass, because this is a
// workflow-integrity rule, not an access-control rule.
export async function advanceScriptStatus(actor: Actor, id: string, nextStatus: string) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  const script = await prisma.script.findFirst({ where: { id, ...scriptScopeFor(actor) } });
  if (!script) throw new ForbiddenError("Script not found or not accessible");

  const target = nextStatus as (typeof script)["status"];
  if (!canTransitionScript(script.status, target)) {
    throw new ForbiddenError(`Cannot move a script from ${script.status} to ${nextStatus}`);
  }

  const updated = await prisma.script.update({
    where: { id },
    data: {
      status: target,
      revisionCount: target === "REVISION_REQUIRED" ? script.revisionCount + 1 : script.revisionCount,
    },
  });

  await prisma.activityLog.create({
    data: {
      profileId: actor.profileId,
      action: `SCRIPT_${target}`,
      entityType: "Script",
      entityId: id,
      metadata: { from: script.status, to: target },
    },
  });

  return updated;
}
