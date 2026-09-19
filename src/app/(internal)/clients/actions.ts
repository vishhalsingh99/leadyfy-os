"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { createClient as createClientRecord, updateClient } from "@/lib/services/client-service";
import { createClientSchema, updateClientSchema } from "@/lib/validations/client";

export type ClientFormResult =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | undefined;

export async function createClientAction(
  _prev: ClientFormResult,
  formData: FormData,
): Promise<ClientFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = createClientSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let clientId: string;
  try {
    const client = await createClientRecord(actor, parsed.data);
    clientId = client.id;
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  revalidatePath("/clients");
  redirect(`/clients/${clientId}`);
}

export async function updateClientAction(
  id: string,
  _prev: ClientFormResult,
  formData: FormData,
): Promise<ClientFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = updateClientSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateClient(actor, id, parsed.data);
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}
