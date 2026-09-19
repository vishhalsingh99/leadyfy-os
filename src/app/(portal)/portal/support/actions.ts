"use server";

import { revalidatePath } from "next/cache";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { createPortalTicket, createPortalTicketSchema } from "@/lib/services/portal/support-service";

export type SupportFormResult = { error: string } | undefined;

export async function createPortalTicketAction(
  _prev: SupportFormResult,
  formData: FormData,
): Promise<SupportFormResult> {
  const actor = await getActorOrRedirect();
  const parsed = createPortalTicketSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { error: "Please fill in both fields." };
  }

  try {
    await createPortalTicket(actor, parsed.data);
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }

  revalidatePath("/portal/support");
}
