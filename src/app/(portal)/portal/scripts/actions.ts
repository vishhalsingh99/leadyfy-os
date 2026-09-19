"use server";

import { revalidatePath } from "next/cache";
import { getActorOrRedirect } from "@/lib/rbac";
import { approvePortalScript, requestPortalScriptRevision } from "@/lib/services/portal/script-service";

export async function approvePortalScriptAction(scriptId: string) {
  const actor = await getActorOrRedirect();
  await approvePortalScript(actor, scriptId);
  revalidatePath(`/portal/scripts/${scriptId}`);
  revalidatePath("/portal");
}

export async function requestPortalScriptRevisionAction(scriptId: string, comment: string) {
  const actor = await getActorOrRedirect();
  await requestPortalScriptRevision(actor, scriptId, comment);
  revalidatePath(`/portal/scripts/${scriptId}`);
  revalidatePath("/portal");
}
