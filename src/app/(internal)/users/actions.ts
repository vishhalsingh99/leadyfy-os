"use server";

import { revalidatePath } from "next/cache";
import { getActorOrRedirect } from "@/lib/rbac";
import { setProfileActive } from "@/lib/services/user-service";

export async function setProfileActiveAction(profileId: string, isActive: boolean) {
  const actor = await getActorOrRedirect();
  await setProfileActive(actor, profileId, isActive);
  revalidatePath("/users");
}
