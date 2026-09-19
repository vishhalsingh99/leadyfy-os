"use server";

import { revalidatePath } from "next/cache";
import { getActorOrRedirect } from "@/lib/rbac";
import { markAllNotificationsRead } from "@/lib/services/notification-service";

export async function markAllNotificationsReadAction() {
  const actor = await getActorOrRedirect();
  await markAllNotificationsRead(actor);
  revalidatePath("/", "layout");
}
