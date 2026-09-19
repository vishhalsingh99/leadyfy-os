"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError, ConflictError } from "@/lib/rbac";
import { createShoot, updateShoot } from "@/lib/services/shoot-service";
import { createShootSchema, updateShootSchema } from "@/lib/validations/shoot";

export type ShootFormResult =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | undefined;

export async function createShootAction(
  _prev: ShootFormResult,
  formData: FormData,
): Promise<ShootFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = createShootSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let shootId: string;
  try {
    const shoot = await createShoot(actor, parsed.data);
    shootId = shoot.id;
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof ConflictError) return { error: e.message };
    throw e;
  }

  revalidatePath("/shoots");
  redirect(`/shoots/${shootId}`);
}

export async function updateShootAction(
  id: string,
  _prev: ShootFormResult,
  formData: FormData,
): Promise<ShootFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = updateShootSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateShoot(actor, id, parsed.data);
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof ConflictError) return { error: e.message };
    throw e;
  }

  revalidatePath("/shoots");
  revalidatePath(`/shoots/${id}`);
  redirect(`/shoots/${id}`);
}
