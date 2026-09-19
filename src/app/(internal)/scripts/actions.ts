"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { createScript, updateScript, advanceScriptStatus } from "@/lib/services/script-service";
import { createScriptSchema, updateScriptSchema } from "@/lib/validations/script";

export type ScriptFormResult =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | undefined;

function formEntriesWithNumbers(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return {
    ...raw,
    ...(raw.videoNumber !== undefined && { videoNumber: Number(raw.videoNumber) }),
  };
}

export async function createScriptAction(
  _prev: ScriptFormResult,
  formData: FormData,
): Promise<ScriptFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = createScriptSchema.safeParse(formEntriesWithNumbers(formData));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let scriptId: string;
  try {
    const script = await createScript(actor, parsed.data);
    scriptId = script.id;
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  revalidatePath("/scripts");
  redirect(`/scripts/${scriptId}`);
}

export async function updateScriptAction(
  id: string,
  _prev: ScriptFormResult,
  formData: FormData,
): Promise<ScriptFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = updateScriptSchema.safeParse(formEntriesWithNumbers(formData));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateScript(actor, id, parsed.data);
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  revalidatePath("/scripts");
  revalidatePath(`/scripts/${id}`);
  redirect(`/scripts/${id}`);
}

export async function advanceScriptStatusAction(id: string, nextStatus: string) {
  const actor = await getActorOrRedirect();
  await advanceScriptStatus(actor, id, nextStatus);
  revalidatePath(`/scripts/${id}`);
}
