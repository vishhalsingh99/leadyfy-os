"use server";

import { revalidatePath } from "next/cache";
import { getActorOrRedirect } from "@/lib/rbac";
import { approvePortalVideo, requestPortalVideoRevision } from "@/lib/services/portal/video-service";

export async function approvePortalVideoAction(videoId: string) {
  const actor = await getActorOrRedirect();
  await approvePortalVideo(actor, videoId);
  revalidatePath(`/portal/videos/${videoId}`);
  revalidatePath("/portal");
}

export async function requestPortalVideoRevisionAction(
  videoId: string,
  comment: string,
  timestampSec?: number,
) {
  const actor = await getActorOrRedirect();
  await requestPortalVideoRevision(actor, videoId, comment, timestampSec);
  revalidatePath(`/portal/videos/${videoId}`);
  revalidatePath("/portal");
}
