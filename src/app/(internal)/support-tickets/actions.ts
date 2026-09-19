"use server";

import { revalidatePath } from "next/cache";
import { getActorOrRedirect } from "@/lib/rbac";
import { updateSupportTicketStatus } from "@/lib/services/support-ticket-service";
import type { SupportTicketStatus } from "@prisma/client";

export async function updateSupportTicketStatusAction(id: string, status: SupportTicketStatus) {
  const actor = await getActorOrRedirect();
  await updateSupportTicketStatus(actor, id, status);
  revalidatePath("/support-tickets");
}
