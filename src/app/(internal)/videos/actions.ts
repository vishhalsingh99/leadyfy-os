"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { createVideo, updateVideo, advanceVideoStatus } from "@/lib/services/video-service";
import { createVideoSchema, updateVideoSchema } from "@/lib/validations/video";

export type VideoFormResult =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | undefined;

export async function createVideoAction(
  _prev: VideoFormResult,
  formData: FormData,
): Promise<VideoFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = createVideoSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let videoId: string;
  try {
    const video = await createVideo(actor, parsed.data);
    videoId = video.id;
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  revalidatePath("/videos");
  redirect(`/videos/${videoId}`);
}

export async function updateVideoAction(
  id: string,
  _prev: VideoFormResult,
  formData: FormData,
): Promise<VideoFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = updateVideoSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateVideo(actor, id, parsed.data);
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  revalidatePath("/videos");
  revalidatePath(`/videos/${id}`);
  redirect(`/videos/${id}`);
}

export async function advanceVideoStatusAction(id: string, nextStatus: string) {
  const actor = await getActorOrRedirect();
  await advanceVideoStatus(actor, id, nextStatus);
  revalidatePath(`/videos/${id}`);
}
