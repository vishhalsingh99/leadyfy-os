import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, requireRole, type Actor } from "@/lib/rbac";
import { canTransitionVideo } from "@/lib/workflow/video-workflow";
import {
  createVideoSchema,
  updateVideoSchema,
  type CreateVideoInput,
  type UpdateVideoInput,
} from "@/lib/validations/video";

function videoScopeFor(actor: Actor): Prisma.VideoWhereInput {
  if (actor.role === "OWNER" || actor.role === "ADMIN") return {};
  if (actor.role !== "EMPLOYEE") return { id: "__none__" };

  if (actor.employeeRole === "EDITOR") return { editorId: actor.employeeId };
  if (actor.employeeRole === "SALES") return { script: { order: { salesOwnerId: actor.employeeId } } };
  if (actor.employeeRole === "SCRIPT_WRITER") return { script: { assignedToId: actor.employeeId } };
  if (actor.employeeRole === "SHOOT_MANAGER") return { shoot: { managerId: actor.employeeId } };
  return { id: "__none__" };
}

function requireEditorWrite(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  if (actor.role === "EMPLOYEE" && actor.employeeRole !== "EDITOR") {
    throw new ForbiddenError("Only Editors can manage videos");
  }
}

export async function listVideos(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  return prisma.video.findMany({
    where: videoScopeFor(actor),
    include: { script: { include: { order: { include: { client: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

// Small lookup for the editor-assignment dropdown, same shape as
// listScriptWriterOptions in script-service.ts.
export async function listEditorOptions() {
  const editors = await prisma.employee.findMany({
    where: { employeeRole: "EDITOR" },
    include: { profile: { select: { name: true } } },
  });
  return editors.map((e) => ({ id: e.id, name: e.profile.name }));
}

export async function getVideo(actor: Actor, id: string) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  const video = await prisma.video.findFirst({
    where: { id, ...videoScopeFor(actor) },
    include: {
      script: { include: { order: { include: { client: true } } } },
      feedback: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!video) throw new ForbiddenError("Video not found or not accessible");
  return video;
}

function toDateOrNull(value?: string) {
  return value ? new Date(value) : null;
}

export async function createVideo(actor: Actor, input: CreateVideoInput) {
  requireEditorWrite(actor);
  const data = createVideoSchema.parse(input);

  const video = await prisma.video.create({
    data: {
      scriptId: data.scriptId,
      shootId: data.shootId || null,
      editorId: data.editorId || actor.employeeId || null,
      title: data.title,
      status: data.status,
      deadline: toDateOrNull(data.deadline),
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "VIDEO_CREATED", entityType: "Video", entityId: video.id },
  });

  return video;
}

export async function updateVideo(actor: Actor, id: string, input: UpdateVideoInput) {
  requireEditorWrite(actor);
  const existing = await prisma.video.findFirst({ where: { id, ...videoScopeFor(actor) } });
  if (!existing) throw new ForbiddenError("Video not found or not accessible");

  const data = updateVideoSchema.parse(input);

  const video = await prisma.video.update({
    where: { id },
    data: {
      ...(data.scriptId !== undefined && { scriptId: data.scriptId }),
      ...(data.shootId !== undefined && { shootId: data.shootId || null }),
      ...(data.editorId !== undefined && { editorId: data.editorId || null }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.deadline !== undefined && { deadline: toDateOrNull(data.deadline) }),
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "VIDEO_UPDATED", entityType: "Video", entityId: video.id },
  });

  return video;
}

// State-enforced pipeline advance (spec section 6.2), same pattern as
// advanceScriptStatus — Owner/Admin do not bypass the transition map.
export async function advanceVideoStatus(actor: Actor, id: string, nextStatus: string) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  const video = await prisma.video.findFirst({ where: { id, ...videoScopeFor(actor) } });
  if (!video) throw new ForbiddenError("Video not found or not accessible");

  const target = nextStatus as (typeof video)["status"];
  if (!canTransitionVideo(video.status, target)) {
    throw new ForbiddenError(`Cannot move a video from ${video.status} to ${nextStatus}`);
  }

  const updated = await prisma.video.update({
    where: { id },
    data: {
      status: target,
      revisionCount: target === "REVISION" ? video.revisionCount + 1 : video.revisionCount,
    },
  });

  await prisma.activityLog.create({
    data: {
      profileId: actor.profileId,
      action: `VIDEO_${target}`,
      entityType: "Video",
      entityId: id,
      metadata: { from: video.status, to: target },
    },
  });

  return updated;
}

// Spec section 6.2's Editor Dashboard: bucket by deadline urgency, computed
// from the same Video rows on every read.
export async function getEditorQueue(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  const videos = await prisma.video.findMany({
    where: { ...videoScopeFor(actor), status: { not: "DELIVERED" } },
    include: { script: { include: { order: { include: { client: true } } } } },
    orderBy: { deadline: "asc" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  const buckets = { overdue: [] as typeof videos, dueToday: [] as typeof videos, dueTomorrow: [] as typeof videos, later: [] as typeof videos };

  for (const video of videos) {
    if (!video.deadline) {
      buckets.later.push(video);
    } else if (video.deadline < today) {
      buckets.overdue.push(video);
    } else if (video.deadline < tomorrow) {
      buckets.dueToday.push(video);
    } else if (video.deadline < dayAfterTomorrow) {
      buckets.dueTomorrow.push(video);
    } else {
      buckets.later.push(video);
    }
  }

  return buckets;
}
