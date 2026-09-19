"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { createCreator, updateCreator, setCreatorAvailability } from "@/lib/services/creator-service";
import { createCreatorSchema, updateCreatorSchema } from "@/lib/validations/creator";

export type CreatorFormResult =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | undefined;

function formEntriesWithNumbers(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return {
    ...raw,
    ...(raw.ratePerVideo !== undefined && { ratePerVideo: Number(raw.ratePerVideo) }),
  };
}

export async function createCreatorAction(
  _prev: CreatorFormResult,
  formData: FormData,
): Promise<CreatorFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = createCreatorSchema.safeParse(formEntriesWithNumbers(formData));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let creatorId: string;
  try {
    const creator = await createCreator(actor, parsed.data);
    creatorId = creator.id;
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  revalidatePath("/creators");
  redirect(`/creators/${creatorId}`);
}

export async function updateCreatorAction(
  id: string,
  _prev: CreatorFormResult,
  formData: FormData,
): Promise<CreatorFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = updateCreatorSchema.safeParse(formEntriesWithNumbers(formData));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateCreator(actor, id, parsed.data);
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  revalidatePath("/creators");
  revalidatePath(`/creators/${id}`);
  redirect(`/creators/${id}`);
}

export async function setAvailabilityAction(creatorId: string, date: string, status: string) {
  const actor = await getActorOrRedirect();
  await setCreatorAvailability(actor, creatorId, { date, status });
  revalidatePath(`/creators/${creatorId}`);
}
