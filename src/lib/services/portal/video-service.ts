import "server-only";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, type Actor } from "@/lib/rbac";
import { canTransitionVideo } from "@/lib/workflow/video-workflow";

function requireClient(actor: Actor): string {
  if (actor.role !== "CLIENT" || !actor.clientId) {
    throw new ForbiddenError("Client portal access only");
  }
  return actor.clientId;
}

// Never expose editorId/shootId/creator info — a client sees title, status,
// and the deliverable pointers, nothing about who's working on it or costs.
const PORTAL_VIDEO_SELECT = {
  id: true,
  title: true,
  status: true,
  revisionCount: true,
  deadline: true,
  draftAssetId: true,
  finalAssetId: true,
  scriptId: true,
} as const;

export async function listPortalVideos(actor: Actor) {
  const clientId = requireClient(actor);
  return prisma.video.findMany({
    where: { script: { order: { clientId } } },
    select: PORTAL_VIDEO_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

export async function getPortalVideo(actor: Actor, videoId: string) {
  const clientId = requireClient(actor);
  const video = await prisma.video.findFirst({
    where: { id: videoId, script: { order: { clientId } } },
    select: { ...PORTAL_VIDEO_SELECT, feedback: { orderBy: { createdAt: "desc" } } },
  });
  if (!video) throw new ForbiddenError("Video not found or not accessible");
  return video;
}

// Spec section 7.1: client Approve / Request Revision, with a timestamped
// feedback log and a revision-counter bump — the client-facing counterpart
// to advanceVideoStatus in the internal video-service.
async function transitionPortalVideo(
  actor: Actor,
  videoId: string,
  target: "FINAL_APPROVED" | "REVISION",
  feedback?: { comment: string; timestampSec?: number },
) {
  const clientId = requireClient(actor);
  const video = await prisma.video.findFirst({ where: { id: videoId, script: { order: { clientId } } } });
  if (!video) throw new ForbiddenError("Video not found or not accessible");
  if (!canTransitionVideo(video.status, target)) {
    throw new ForbiddenError(`Cannot move a video from ${video.status} to ${target}`);
  }

  const updated = await prisma.video.update({
    where: { id: videoId },
    data: {
      status: target,
      revisionCount: target === "REVISION" ? video.revisionCount + 1 : video.revisionCount,
    },
  });

  if (feedback) {
    await prisma.videoFeedback.create({
      data: {
        videoId,
        authorClientId: clientId,
        comment: feedback.comment,
        timestampSec: feedback.timestampSec ?? null,
      },
    });
  }

  await prisma.activityLog.create({
    data: {
      clientId,
      action: `VIDEO_${target}`,
      entityType: "Video",
      entityId: videoId,
      metadata: { from: video.status, to: target },
    },
  });

  return updated;
}

export function approvePortalVideo(actor: Actor, videoId: string) {
  return transitionPortalVideo(actor, videoId, "FINAL_APPROVED");
}

export function requestPortalVideoRevision(
  actor: Actor,
  videoId: string,
  comment: string,
  timestampSec?: number,
) {
  return transitionPortalVideo(actor, videoId, "REVISION", { comment, timestampSec });
}
