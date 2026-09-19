"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError, ConflictError } from "@/lib/rbac";
import { createCreatorPayout, updateCreatorPayout } from "@/lib/services/creator-payout-service";
import { createCreatorPayoutSchema, updateCreatorPayoutSchema } from "@/lib/validations/creator-payout";

export type CreatorPayoutFormResult =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | undefined;

function formEntriesWithNumbers(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return {
    ...raw,
    ...(raw.videoCount !== undefined && { videoCount: Number(raw.videoCount) }),
    ...(raw.amount !== undefined && { amount: Number(raw.amount) }),
  };
}

export async function createCreatorPayoutAction(
  _prev: CreatorPayoutFormResult,
  formData: FormData,
): Promise<CreatorPayoutFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = createCreatorPayoutSchema.safeParse(formEntriesWithNumbers(formData));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createCreatorPayout(actor, parsed.data);
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof ConflictError) return { error: e.message };
    throw e;
  }

  revalidatePath("/creator-payouts");
  redirect("/creator-payouts");
}

export async function updateCreatorPayoutAction(
  id: string,
  _prev: CreatorPayoutFormResult,
  formData: FormData,
): Promise<CreatorPayoutFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = updateCreatorPayoutSchema.safeParse(formEntriesWithNumbers(formData));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateCreatorPayout(actor, id, parsed.data);
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof ConflictError) return { error: e.message };
    throw e;
  }

  revalidatePath("/creator-payouts");
  redirect("/creator-payouts");
}
